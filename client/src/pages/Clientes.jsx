import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';

const VAZIO = { nome: '', cpf: '', telefone: '', email: '', endereco: '' };

export default function Clientes() {
  const { admin } = useAuth();
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setLista(await api.get(`/clientes${busca ? `?q=${encodeURIComponent(busca)}` : ''}`));
  }
  useEffect(() => { carregar(); }, [busca]);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (form.id) await api.put(`/clientes/${form.id}`, form);
      else await api.post('/clientes', form);
      setForm(null);
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este cliente?')) return;
    await api.del(`/clientes/${id}`);
    carregar();
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Clientes</h1><p>Cadastro de clientes do mercado</p></div>
        {admin && <button className="btn" onClick={() => setForm({ ...VAZIO })}>+ Novo cliente</button>}
      </div>

      <div className="toolbar">
        <input className="busca" placeholder="Buscar por nome ou CPF..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="card">
        {lista.length === 0 ? <div className="vazio">Nenhum cliente cadastrado.</div> : (
          <table>
            <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th>{admin && <th></th>}</tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.cpf || '—'}</td>
                  <td>{c.telefone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  {admin && (
                    <td className="num">
                      <button className="btn-link" onClick={() => setForm(c)}>Editar</button>
                      <button className="btn-link perigo" onClick={() => excluir(c.id)}>Excluir</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <Modal titulo={form.id ? 'Editar cliente' : 'Novo cliente'} onFechar={() => setForm(null)}>
          {erro && <div className="erro-msg">{erro}</div>}
          <form onSubmit={salvar}>
            <div className="form-row"><label>Nome *</label><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="form-grid">
              <div><label>CPF</label><input value={form.cpf || ''} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><label>Telefone</label><input value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="form-row mt"><label>E-mail</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-row"><label>Endereço</label><input value={form.endereco || ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
            <div className="modal-actions">
              <button type="button" className="btn secundario" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn">Salvar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
