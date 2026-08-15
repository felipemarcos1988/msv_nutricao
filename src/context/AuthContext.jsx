import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, signIn, signUp, signOut } from '../services/neonAuth';
import { fetchUserProfile, syncUserRole } from '../services/neonDb';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const enrichUserWithProfile = async (baseUser) => {
    if (!baseUser || !baseUser.email) return baseUser;
    try {
      const profile = await fetchUserProfile(baseUser.email);
      if (profile) {
        return {
          ...baseUser,
          ...profile,
          role: profile.role || 'nutricionista',
        };
      }
    } catch (e) {
      console.warn('Could not enrich user profile from Neon:', e);
    }
    return {
      ...baseUser,
      role: baseUser.role || 'nutricionista',
    };
  };

  const checkAuthSession = async () => {
    try {
      setLoading(true);
      const sessionData = await getSession();
      if (sessionData && sessionData.user) {
        const enriched = await enrichUserWithProfile(sessionData.user);
        setUser(enriched);
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

  const loginUser = async (email, password, expectedRole = null) => {
    const res = await signIn({ email, password });
    const rawUser = res?.user || (await getSession())?.user;
    
    if (rawUser) {
      // Se um perfil for especificado no login e o usuário ainda não tiver role definida no banco, sincroniza
      if (expectedRole) {
        const profile = await fetchUserProfile(email);
        if (!profile || !profile.role) {
          await syncUserRole(email, expectedRole);
        }
      }
      const enriched = await enrichUserWithProfile(rawUser);
      setUser(enriched);
      setSession(res?.session || res);
      return { ...res, user: enriched };
    } else {
      await checkAuthSession();
      return res;
    }
  };

  const registerUser = async (name, email, password, role = 'nutricionista') => {
    const res = await signUp({ name, email, password });
    
    // Sincroniza o papel do usuário (Nutricionista ou Paciente) diretamente no Neon DB
    await syncUserRole(email, role);

    const rawUser = res?.user || (await getSession())?.user;
    if (rawUser) {
      const enriched = await enrichUserWithProfile({ ...rawUser, role });
      setUser(enriched);
      setSession(res?.session || res);
      return { ...res, user: enriched };
    } else {
      await checkAuthSession();
      return res;
    }
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
