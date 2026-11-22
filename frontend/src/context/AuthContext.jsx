import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Refina el rol contra el backend; nunca tumba la sesión si falla */
  const cargarPerfil = useCallback(async () => {
    try {
      const { data } = await api.get('/usuarios/perfil');
      const u = { correo: data.correo_user, rol: data.rol || 'admin' };
      localStorage.setItem('usuario', JSON.stringify(u));
      setUsuario(u);
    } catch (err) {
      console.warn('[auth] /usuarios/perfil no disponible; uso la sesión local:', err?.response?.status);
      const guardado = localStorage.getItem('usuario');
      if (guardado) {
        try {
          const u = JSON.parse(guardado);
          setUsuario({ correo: u.correo || u.email, rol: u.rol || 'admin' });
        } catch { /* noop */ }
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 1) Sesión INMEDIATA desde localStorage (evita el rebote al Login)
    const guardado = localStorage.getItem('usuario');
    if (guardado) {
      try {
        const u = JSON.parse(guardado);
        setUsuario({ correo: u.correo || u.email, rol: u.rol || 'admin' });
      } catch { /* perfil decidirá */ }
    }

    // 2) Rol real desde el backend, en segundo plano
    cargarPerfil().finally(() => setLoading(false));
  }, [cargarPerfil]);

  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/usuarios/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, rol, correo } = response.data;
      const u = { correo: correo || email, rol: rol || 'admin' };

      localStorage.setItem('token', access_token);
      localStorage.setItem('usuario', JSON.stringify(u));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUsuario(u);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete api.defaults.headers.common['Authorization'];
    setUsuario(null);
  };

  const rol = usuario?.rol || 'admin';
  const esAdmin = rol === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, rol, esAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);