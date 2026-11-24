import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/http';

const AuthContext = createContext(null);

function clearStoredSession() {
  sessionStorage.removeItem('lep_token');
  sessionStorage.removeItem('lep_user');
  // Remove credentials saved by older versions that used persistent localStorage.
  localStorage.removeItem('lep_token');
  localStorage.removeItem('lep_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lep_user')); }
    catch { return null; }
  });
  const [authLoading, setAuthLoading] = useState(() => Boolean(sessionStorage.getItem('lep_token')));

  const clearSession = () => {
    clearStoredSession();
    setUser(null);
  };

  const save = data => {
    sessionStorage.setItem('lep_token', data.token);
    sessionStorage.setItem('lep_user', JSON.stringify(data.user));
    // Keep credentials scoped to this browser tab/session, not the whole browser profile.
    localStorage.removeItem('lep_token');
    localStorage.removeItem('lep_user');
    setUser(data.user);
  };

  const login = async credentials => {
    const data = (await api.post('/auth/login', credentials)).data;
    save(data);
    return data;
  };

  const register = async values => {
    const data = (await api.post('/auth/register', values)).data;
    save(data);
    return data;
  };

  const logout = () => clearSession();

  useEffect(() => {
    const handleExpired = () => clearSession();
    window.addEventListener('lep:session-expired', handleExpired);

    // A legacy localStorage token must never silently restore a previous user's session.
    localStorage.removeItem('lep_token');
    localStorage.removeItem('lep_user');

    if (sessionStorage.getItem('lep_token')) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          sessionStorage.setItem('lep_user', JSON.stringify(data.user));
        })
        .catch(() => clearSession())
        .finally(() => setAuthLoading(false));
    } else {
      setUser(null);
      setAuthLoading(false);
    }

    return () => window.removeEventListener('lep:session-expired', handleExpired);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, authLoading }), [user, authLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
