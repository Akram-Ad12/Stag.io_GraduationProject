import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, getMe, registerStudent, registerCompany } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, role }
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) fetchMe();
    else setLoading(false);
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    await fetchMe();
  };

  const register = async (role, data) => {
    if (role === 'student') {
      await registerStudent(data);
    } else {
      await registerCompany(data);
    }
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
