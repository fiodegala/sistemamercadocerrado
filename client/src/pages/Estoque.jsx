import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Modal from '../components/Modal.jsx';

export default function Estoque() {
  const { admin } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const [a, m, p] = await Promise.all([
      api.get('/estoque/alertas'),
      api.get('/estoque/movimentacoes'),
      api.get('/produtos'),
    ]);
    setAlertas(a); setMovimentacoes(m); setProdutos(p);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/estoque/movimentacoes', {
        produto_id: Number(form.produto_id),
        tipo: form.tipo,
        quantidade: Number(form.quantidade),
        motivo: form.motivo,
      });
      setForm(null);
      carregar();
    } catch (err) { setErro(err.message); }
  }

  const tipoLabel = { entrada: '↑ Entrada', saida: '↓ Saída', ajuste: '⟳ Ajuste' };

  return (
    <>
      <div className="page-header">
        <div><h1>Estoque</h1><p>Movimentações e alertas de reposição</p></div>
        {admin && (
          <button className="btn" onClick={() => setForm({ produto_id: '', tipo: 'entrada', quantidade: 1, motivo: '' })}>
            + Movimentação
          </button>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">⚠️ Alertas de estoque baixo ({alertas.length})</div>
          {alertas.length === 0 ? <div className="vazio">Tudo em ordem — nenhum produto abaixo do mínimo.</div> : (
            <table>
              <thead><tr><th>Produto</th><th className="num">Atual</th><th className="num">Mínimo</th></tr></thead>
              <tbody>
                {alertas.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td className="num">
                      <span className={`badge ${p.estoque <= 0 ? 'zerado' : 'baixo'}`}>{p.estoque} {p.unidade}</span>
                    </td>
                    <td className="num">{p.estoque_minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="section-title">Últimas movimentações</div>
          {movimentacoes.length === 0 ? <div className="vazio">Nenhuma movimentação registrada.</div> : (
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th className="num">Qtd</th></tr></thead>
              <tbody>
                {movimentacoes.slice(0, 15).map((m) => (
                  <tr key={m.id}>
                    <td><small>{m.criado_em}</small></td>
                    <td>{m.produto_nome}</td>
                    <td>{tipoLabel[m.tipo] || m.tipo}</td>
                    <td className="num">{m.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {form && (
        <Modal titulo="Nova movimentação de estoque" onFechar={() => setForm(null)}>
          {erro && <div className="erro-msg">{erro}</div>}
          <form onSubmit={salvar}>
            <div className="form-row">
              <label>Produto *</label>
              <select required value={form.produto_id} onChange={(e) => setForm({ ...form, produto_id: e.target.value })}>
                <option value="">Selecione...</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} (atual: {p.estoque} {p.unidade})</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div>
                <label>Tipo *</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="entrada">Entrada (compra/reposição)</option>
                  <option value="saida">Saída (perda/quebra)</option>
                  <option value="ajuste">Ajuste (definir valor exato)</option>
                </select>
              </div>
              <div><label>Quantidade *</label><input required type="number" step="0.001" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
            </div>
            <div className="form-row mt"><label>Motivo</label><input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ex: compra do fornecedor X" /></div>
            <div className="modal-actions">
              <button type="button" className="btn secundario" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn">Registrar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
