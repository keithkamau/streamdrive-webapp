import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveProfile = async (authUser) => {
    if (!authUser) {
      console.log("[Auth] No auth user");
      setUser(null);
      return;
    }

    console.log("[Auth] Auth user found:", authUser.email);

    const { data, error } = await supabase
      .from("residents")
      .select("*")
      .eq("email", authUser.email)
      .single();

    console.log("[Auth] Resident lookup:", { data, error });

    if (error || !data) {
      console.log("[Auth] No resident record found — signing out");
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    if (!data.is_admin) {
      console.log("[Auth] Resident is not admin — signing out");
      await supabase.auth.signOut();
      setUser(null);
      return;
    }

    console.log("[Auth] Admin resolved successfully:", data.name);

    setUser({
      id: authUser.id,
      firstName: data.name.split(" ")[0],
      lastName: data.name.split(" ").slice(1).join(" "),
      name: data.name,
      email: data.email,
      phone: data.phone,
      houseNumber: data.house_number,
      isAdmin: data.is_admin,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "[Auth] Initial session:",
        session ? session.user.email : "none",
      );
      resolveProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        "[Auth] Auth state change:",
        _event,
        session?.user?.email ?? "none",
      );
      resolveProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
  console.log('[Auth] Attempting login for:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('[Auth] Login data:', data);
  console.log('[Auth] Login error:', error?.message, error?.status);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await resolveProfile(session?.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
