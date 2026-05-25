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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase auth user
  const [admin, setAdmin] = useState(null); // residents row for this admin
  const [loading, setLoading] = useState(true);

  // ── Resolve admin profile from a Supabase session ────────────────────────
  // 1. Look up the user's email in the residents table.
  // 2. Check their house_number against the admin_houses DB table.
  // 3. If either check fails, sign them out immediately.

  const resolveAdmin = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setAdmin(null);
      return;
    }

    try {
      const resident = await getResidentByEmail(authUser.email);

      if (!resident) {
        // Email not in residents table — not allowed
        await supabase.auth.signOut();
        setUser(null);
        setAdmin(null);
        return;
      }

      // Check admin_houses table (DB-driven, not hardcoded)
      const adminStatus = await isAdminHouse(resident.houseNumber);

      if (!adminStatus) {
        // Resident exists but their house isn't an admin house
        await supabase.auth.signOut();
        setUser(null);
        setAdmin(null);
        return;
      }

      setUser(authUser);
      setAdmin(resident);
    } catch (err) {
      console.error("AuthContext: error resolving admin profile", err);
      await supabase.auth.signOut();
      setUser(null);
      setAdmin(null);
    }
  }, []);

  // ── Bootstrap: check existing session on mount ───────────────────────────

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await resolveAdmin(session.user);
      }
      setLoading(false);
    });

    // Listen for sign-in / sign-out / token-refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setAdmin(null);
        return;
      }

      // PASSWORD_RECOVERY — don't redirect, let ResetPasswordPage handle it
      if (event === "PASSWORD_RECOVERY") return;

      if (session?.user) {
        await resolveAdmin(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveAdmin]);

  // ── Sign out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdmin(null);
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    user, // Supabase auth user object
    admin, // residents row (camelCase) for the logged-in admin
    loading,
    signOut,
    // Convenience: resolved display name
    displayName: admin?.name ?? user?.email ?? "",
    houseNumber: admin?.houseNumber ?? "",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
