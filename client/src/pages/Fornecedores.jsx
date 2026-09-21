import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';

const VAZIO = { nome: '', cnpj: '', telefone: '', email: '' };

export default function Fornecedores() {
  const { admin } = useAuth();
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setLista(await api.get(`/fornecedores${busca ? `?q=${encodeURIComponent(busca)}` : ''}`));
  }
  useEffect(() => { carregar(); }, [busca]);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (form.id) await api.put(`/fornecedores/${form.id}`, form);
      else await api.post('/fornecedores', form);
      setForm(null);
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este fornecedor?')) return;
    await api.del(`/fornecedores/${id}`);
    carregar();
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Fornecedores</h1><p>Cadastro de fornecedores</p></div>
        {admin && <button className="btn" onClick={() => setForm({ ...VAZIO })}>+ Novo fornecedor</button>}
      </div>

      <div className="toolbar">
        <input className="busca" placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="card">
        {lista.length === 0 ? <div className="vazio">Nenhum fornecedor cadastrado.</div> : (
          <table>
            <thead><tr><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>E-mail</th>{admin && <th></th>}</tr></thead>
            <tbody>
              {lista.map((f) => (
                <tr key={f.id}>
                  <td>{f.nome}</td>
                  <td>{f.cnpj || '—'}</td>
                  <td>{f.telefone || '—'}</td>
                  <td>{f.email || '—'}</td>
                  {admin && (
                    <td className="num">
                      <button className="btn-link" onClick={() => setForm(f)}>Editar</button>
                      <button className="btn-link perigo" onClick={() => excluir(f.id)}>Excluir</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <Modal titulo={form.id ? 'Editar fornecedor' : 'Novo fornecedor'} onFechar={() => setForm(null)}>
          {erro && <div className="erro-msg">{erro}</div>}
          <form onSubmit={salvar}>
            <div className="form-row"><label>Nome *</label><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="form-grid">
              <div><label>CNPJ</label><input value={form.cnpj || ''} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
              <div><label>Telefone</label><input value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            </div>
            <div className="form-row mt"><label>E-mail</label><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
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
