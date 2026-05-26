// context/AuthContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { getResidentByEmail } from "../services/residentService";
import { isAdminHouse } from "../services/settingsService";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  // `user` is a merged object: resident profile fields + Supabase auth id.
  // All pages destructure from `user` directly — name, houseNumber, isAdmin,
  // firstName, lastName, email, phone.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build the merged user object that all existing pages expect.
  // Splits `name` into firstName / lastName for Announcements / Profile.
  function buildUser(authUser, resident) {
    const nameParts = (resident.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    return {
      // Resident profile fields
      id: resident.id,
      name: resident.name,
      firstName,
      lastName,
      email: resident.email ?? authUser.email,
      phone: resident.phone ?? "",
      houseNumber: resident.houseNumber,
      isAdmin: true, // only admins can log in
      paymentStatus: resident.paymentStatus,
      monthsOverdue: resident.monthsOverdue,
      joinedAt: resident.joinedAt,
      // Raw Supabase auth id for supabase.auth calls in Profile
      authId: authUser.id,
    };
  }

  // ── Resolve admin profile after a successful Supabase sign-in ─────────────
  // Returns { success: true } or { success: false, error: string }
  // so LoginPage can show the right error message.
  const resolveAdmin = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      return { success: false, error: "No session." };
    }

    try {
      const resident = await getResidentByEmail(authUser.email);

      if (!resident) {
        await supabase.auth.signOut();
        setUser(null);
        return {
          success: false,
          error: "No admin account found for this email.",
        };
      }

      const adminStatus = await isAdminHouse(resident.houseNumber);
      if (!adminStatus) {
        await supabase.auth.signOut();
        setUser(null);
        return {
          success: false,
          error: "This account does not have admin access.",
        };
      }

      setUser(buildUser(authUser, resident));
      return { success: true };
    } catch (err) {
      console.error("AuthContext: resolveAdmin failed", err);
      await supabase.auth.signOut();
      setUser(null);
      return { success: false, error: "An error occurred. Please try again." };
    }
  }, []);

  // ── login — called by LoginPage ───────────────────────────────────────────
  // Accepts { email, password }, returns { success, error? }
  const login = useCallback(
    async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return resolveAdmin(data.user);
    },
    [resolveAdmin],
  );

  // ── signOut — called by TopBar / Sidebar ──────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ── refreshUser — called by Profile after saving details ──────────────────
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) await resolveAdmin(session.user);
  }, [resolveAdmin]);

  // ── Bootstrap: restore session on mount ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) await resolveAdmin(session.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }
      if (event === "PASSWORD_RECOVERY") {
        return;
      } // ResetPasswordPage handles this
      if (session?.user) await resolveAdmin(session.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveAdmin]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user, // merged resident + auth object; null when logged out
    loading,
    login, // LoginPage: ({ email, password }) => { success, error? }
    signOut, // TopBar / Sidebar
    refreshUser, // Profile: re-fetches resident row after editing details
    // Convenience aliases used by TopBar / Sidebar
    displayName: user?.name ?? user?.email ?? "",
    houseNumber: user?.houseNumber ?? "",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
