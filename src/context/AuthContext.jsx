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
  // `user` is a merged object: resident profile fields + auth email + id.
  // All pages destructure from `user` directly (name, houseNumber, isAdmin,
  // firstName, lastName, email, phone) — no separate `admin` object needed.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build the merged user object that all existing pages expect.
  // Splits `name` into firstName / lastName for Announcements / Profile.
  function buildUser(authUser, resident) {
    const nameParts = (resident.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName  = nameParts.slice(1).join(" ") || firstName;

    return {
      // Resident profile fields
      id:           resident.id,
      name:         resident.name,
      firstName,
      lastName,
      email:        resident.email ?? authUser.email,
      phone:        resident.phone ?? "",
      houseNumber:  resident.houseNumber,
      isAdmin:      true,                    // only admins can log in
      paymentStatus: resident.paymentStatus,
      monthsOverdue: resident.monthsOverdue,
      joinedAt:     resident.joinedAt,

      // Keep raw Supabase auth id accessible as authId for supabase.auth calls
      authId: authUser.id,
    };
  }

  const resolveAdmin = useCallback(async (authUser) => {
    if (!authUser) { setUser(null); return; }

    try {
      const resident = await getResidentByEmail(authUser.email);

      if (!resident) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      const adminStatus = await isAdminHouse(resident.houseNumber);
      if (!adminStatus) {
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      setUser(buildUser(authUser, resident));
    } catch (err) {
      console.error("AuthContext: resolveAdmin failed", err);
      await supabase.auth.signOut();
      setUser(null);
    }
  }, []);

  // Re-fetch the resident row and rebuild user — called by Profile after edits.
  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await resolveAdmin(session.user);
  }, [resolveAdmin]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) await resolveAdmin(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_OUT")       { setUser(null); return; }
        if (event === "PASSWORD_RECOVERY") return;
        if (session?.user) await resolveAdmin(session.user);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [resolveAdmin]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,           // merged resident + auth object; null when logged out
    loading,
    signOut,
    refreshUser,    // Profile.jsx calls this after saving details
    // Legacy convenience aliases used by TopBar / Sidebar
    displayName: user?.name ?? user?.email ?? "",
    houseNumber: user?.houseNumber ?? "",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
