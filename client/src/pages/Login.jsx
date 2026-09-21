import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import logo from '../assets/logo.webp';

export default function Login({ tema, onAlternarTema }) {
  const { entrar } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function submeter(e) {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try {
      await entrar(usuario, senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-tela">
      <form className="login-card" onSubmit={submeter}>
        <img src={logo} alt="Cerrado Premium Supermercado" className="login-logo-img" />
        <div className="login-sub">Sistema de Gestão</div>

        {erro && <div className="erro-msg">{erro}</div>}

        <div className="form-row">
          <label>Usuário</label>
          <input id="login-usuario" autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="ex: admin" />
        </div>
        <div className="form-row">
          <label>Senha</label>
          <input id="login-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" />
        </div>

        <button type="submit" className="btn" style={{ width: '100%', marginTop: 6 }} disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="login-dica">
          Acesso de demonstração:<br />
          <b>admin / admin123</b> (administrador) · <b>caixa / caixa123</b> (operador)
        </div>

        {onAlternarTema && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button type="button" className="btn-link" onClick={onAlternarTema}>
              {tema === 'dark' ? '☀️ Tema claro' : '🌙 Tema escuro'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
