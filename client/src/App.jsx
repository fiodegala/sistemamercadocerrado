import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import logo from './assets/logo.webp';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PDV from './pages/PDV.jsx';
import Produtos from './pages/Produtos.jsx';
import Estoque from './pages/Estoque.jsx';
import Clientes from './pages/Clientes.jsx';
import Fornecedores from './pages/Fornecedores.jsx';
import Relatorios from './pages/Relatorios.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/pdv', label: 'PDV / Vendas', icon: '🛒' },
  { to: '/produtos', label: 'Produtos', icon: '📦' },
  { to: '/estoque', label: 'Estoque', icon: '🏷️' },
  { to: '/clientes', label: 'Clientes', icon: '👤' },
  { to: '/fornecedores', label: 'Fornecedores', icon: '🚚' },
  { to: '/relatorios', label: 'Relatórios', icon: '📈' },
];

// Detecta o tema inicial: escolha salva ou preferência do sistema.
function temaInicial() {
  try {
    const salvo = localStorage.getItem('mc_tema');
    if (salvo === 'light' || salvo === 'dark') return salvo;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const { usuario, carregando, sair } = useAuth();
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem('mc_tema', tema); } catch { /* ignore */ }
  }, [tema]);

  const alternarTema = () => setTema((t) => (t === 'dark' ? 'light' : 'dark'));

  if (carregando) return <div className="vazio" style={{ paddingTop: 80 }}>Carregando...</div>;
  if (!usuario) return <Login tema={tema} onAlternarTema={alternarTema} />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="Cerrado Premium Supermercado" className="brand-logo-img" />
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="usuario-box">
          <div className="usuario-info">
            <span className="usuario-avatar">{usuario.nome.charAt(0)}</span>
            <div>
              <strong>{usuario.nome}</strong>
              <small>{usuario.perfil === 'admin' ? 'Administrador' : 'Operador de caixa'}</small>
            </div>
          </div>
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
        <footer className="sidebar-footer">
          <span>v0.1.0 · Premium</span>
          <button className="tema-btn" onClick={alternarTema}>
            {tema === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </footer>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pdv" element={<PDV />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </main>
    </div>
  );
}
