import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getRefreshToken, refreshSession, signIn, signOut } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (!getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        const restoredUser = await refreshSession();
        if (active) setUser(restoredUser);
      } catch {
        clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };
    const onExpired = () => setUser(null);
    window.addEventListener("safeway:session-expired", onExpired);
    restore();
    return () => {
      active = false;
      window.removeEventListener("safeway:session-expired", onExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const signedInUser = await signIn(email, password);
    setUser(signedInUser);
    return signedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(user?.id);
    } finally {
      setUser(null);
    }
  }, [user]);

  const updateCurrentUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const clearCurrentSession = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, updateCurrentUser, clearCurrentSession }), [user, loading, login, logout, updateCurrentUser, clearCurrentSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
