import { NavLink, Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">🌿</span>
          <div>
            <strong>Mercado Cerrado</strong>
            <small>Sistema de Gestão</small>
          </div>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <footer className="sidebar-footer">v0.1.0 · MVP</footer>
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
