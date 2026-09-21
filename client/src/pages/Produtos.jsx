import { useEffect, useState } from 'react';
import { api, brl } from '../api.js';
import Modal from '../components/Modal.jsx';

const VAZIO = {
  nome: '', codigo_barras: '', categoria_id: '', unidade: 'un',
  preco_custo: 0, preco_venda: 0, estoque: 0, estoque_minimo: 0, ativo: 1,
};

function statusEstoque(p) {
  if (p.estoque <= 0) return <span className="badge zerado">Zerado</span>;
  if (p.estoque <= p.estoque_minimo) return <span className="badge baixo">Baixo</span>;
  return <span className="badge ok">OK</span>;
}

export default function Produtos() {
  const [lista, setLista] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [novaCat, setNovaCat] = useState('');

  async function carregar() {
    setLista(await api.get(`/produtos${busca ? `?q=${encodeURIComponent(busca)}` : ''}`));
  }
  async function carregarCategorias() {
    setCategorias(await api.get('/categorias'));
  }
  useEffect(() => { carregar(); }, [busca]);
  useEffect(() => { carregarCategorias(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const payload = { ...form, categoria_id: form.categoria_id || null };
      if (form.id) await api.put(`/produtos/${form.id}`, payload);
      else await api.post('/produtos', payload);
      setForm(null);
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function excluir(id) {
    if (!confirm('Excluir este produto?')) return;
    await api.del(`/produtos/${id}`);
    carregar();
  }

  async function criarCategoria() {
    if (!novaCat.trim()) return;
    try {
      const c = await api.post('/categorias', { nome: novaCat });
      setNovaCat('');
      await carregarCategorias();
      setForm((f) => ({ ...f, categoria_id: c.id }));
    } catch (err) { setErro(err.message); }
  }

  return (
    <>
      <div className="page-header">
        <div><h1>Produtos</h1><p>{lista.length} produto(s) cadastrado(s)</p></div>
        <button className="btn" onClick={() => setForm({ ...VAZIO })}>+ Novo produto</button>
      </div>

      <div className="toolbar">
        <input className="busca" placeholder="Buscar por nome ou código de barras..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="card">
        {lista.length === 0 ? <div className="vazio">Nenhum produto encontrado.</div> : (
          <table>
            <thead>
              <tr>
                <th>Produto</th><th>Categoria</th><th className="num">Preço venda</th>
                <th className="num">Estoque</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nome}</strong>
                    {p.codigo_barras && <><br /><small style={{ color: '#6b7280' }}>{p.codigo_barras}</small></>}
                  </td>
                  <td>{p.categoria_nome || '—'}</td>
                  <td className="num">{brl(p.preco_venda)}</td>
                  <td className="num">{p.estoque} {p.unidade}</td>
                  <td>{statusEstoque(p)}</td>
                  <td className="num">
                    <button className="btn-link" onClick={() => setForm(p)}>Editar</button>
                    <button className="btn-link perigo" onClick={() => excluir(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <Modal titulo={form.id ? 'Editar produto' : 'Novo produto'} onFechar={() => setForm(null)}>
          {erro && <div className="erro-msg">{erro}</div>}
          <form onSubmit={salvar}>
            <div className="form-row"><label>Nome *</label><input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="form-grid">
              <div><label>Código de barras</label><input value={form.codigo_barras || ''} onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })} /></div>
              <div>
                <label>Categoria</label>
                <select value={form.categoria_id || ''} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">— sem categoria —</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label>Unidade</label>
                <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                  <option value="un">un</option><option value="kg">kg</option>
                  <option value="L">L</option><option value="cx">cx</option>
                </select>
              </div>
            </div>
            <div className="flex mt" style={{ fontSize: 13 }}>
              <input placeholder="Criar nova categoria" value={novaCat} onChange={(e) => setNovaCat(e.target.value)} />
              <button type="button" className="btn secundario pequeno" onClick={criarCategoria}>Add categoria</button>
            </div>
            <div className="form-grid mt">
              <div><label>Preço de custo</label><input type="number" step="0.01" value={form.preco_custo} onChange={(e) => setForm({ ...form, preco_custo: e.target.value })} /></div>
              <div><label>Preço de venda</label><input type="number" step="0.01" value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: e.target.value })} /></div>
            </div>
            <div className="form-grid mt">
              <div><label>Estoque atual</label><input type="number" step="0.001" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} /></div>
              <div><label>Estoque mínimo</label><input type="number" step="0.001" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} /></div>
            </div>
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
