import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, onNaoAutorizado } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  function sair() {
    setToken(null);
    setUsuario(null);
  }

  // Revalida a sessão ao abrir o app (se houver token salvo).
  useEffect(() => {
    onNaoAutorizado(() => { setToken(null); setUsuario(null); });
    if (!getToken()) { setCarregando(false); return; }
    api.get('/auth/me')
      .then((r) => setUsuario(r.usuario))
      .catch(() => setToken(null))
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(usuarioLogin, senha) {
    const r = await api.post('/auth/login', { usuario: usuarioLogin, senha });
    setToken(r.token);
    setUsuario(r.usuario);
  }

  const admin = usuario?.perfil === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, admin, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
