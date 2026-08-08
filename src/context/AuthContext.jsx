import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, signIn, signUp, signOut } from '../services/neonAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthSession = async () => {
    try {
      setLoading(true);
      const sessionData = await getSession();
      if (sessionData && sessionData.user) {
        setUser(sessionData.user);
        setSession(sessionData.session || sessionData);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthSession();
  }, []);

  const loginUser = async (email, password) => {
    const res = await signIn({ email, password });
    if (res?.user) {
      setUser(res.user);
      setSession(res.session || res);
    } else {
      // Re-fetch session to ensure cookie state updated correctly
      await checkAuthSession();
    }
    return res;
  };

  const registerUser = async (name, email, password) => {
    const res = await signUp({ name, email, password });
    if (res?.user) {
      setUser(res.user);
      setSession(res.session || res);
    } else {
      // Re-fetch session
      await checkAuthSession();
    }
    return res;
  };

  const logoutUser = async () => {
    await signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        refreshSession: checkAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
