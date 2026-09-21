import { useEffect, useMemo, useRef, useState } from 'react';
import { api, brl } from '../api.js';
import Cupom from '../components/Cupom.jsx';

export default function PDV() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [pagamento, setPagamento] = useState('dinheiro');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ultimaVenda, setUltimaVenda] = useState(null);
  const [cupomAberto, setCupomAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [bipeMsg, setBipeMsg] = useState(null); // { ok: bool, texto }
  const codigoRef = useRef(null);

  useEffect(() => { api.get('/clientes').then(setClientes).catch(() => {}); }, []);

  useEffect(() => {
    let ativo = true;
    api.get(`/produtos?ativos=1${busca ? `&q=${encodeURIComponent(busca)}` : ''}`)
      .then((r) => { if (ativo) setResultados(r.slice(0, 30)); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [busca]);

  function adicionar(produto) {
    setErro('');
    setCarrinho((c) => {
      const existe = c.find((i) => i.produto_id === produto.id);
      if (existe) {
        return c.map((i) => i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...c, {
        produto_id: produto.id, nome: produto.nome, unidade: produto.unidade,
        preco_unitario: produto.preco_venda, quantidade: 1, estoque: produto.estoque,
      }];
    });
  }

  function mudarQtd(id, qtd) {
    setCarrinho((c) => c.map((i) => i.produto_id === id ? { ...i, quantidade: Math.max(0, Number(qtd)) } : i));
  }
  function remover(id) { setCarrinho((c) => c.filter((i) => i.produto_id !== id)); }

  // Leitor de código de barras: o scanner "digita" o código e dá Enter.
  async function biparCodigo(e) {
    e.preventDefault();
    const cod = codigo.trim();
    if (!cod) return;
    try {
      const p = await api.get(`/produtos/codigo/${encodeURIComponent(cod)}`);
      adicionar(p);
      setBipeMsg({ ok: true, texto: `✓ ${p.nome} adicionado` });
    } catch {
      setBipeMsg({ ok: false, texto: `✗ Código ${cod} não encontrado` });
    } finally {
      setCodigo('');
      codigoRef.current?.focus();
    }
  }

  const subtotal = useMemo(() => carrinho.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0), [carrinho]);
  const total = Math.max(0, subtotal - Number(desconto || 0));

  async function finalizar() {
    setErro(''); setSucesso('');
    const itens = carrinho.filter((i) => i.quantidade > 0);
    if (itens.length === 0) { setErro('Adicione ao menos um item.'); return; }
    try {
      const venda = await api.post('/vendas', {
        cliente_id: clienteId || null,
        desconto: Number(desconto || 0),
        forma_pagamento: pagamento,
        itens: itens.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade, preco_unitario: i.preco_unitario })),
      });
      setSucesso(`Venda #${venda.id} registrada — ${brl(venda.total)}`);
      setUltimaVenda(venda);
      setCupomAberto(true);
      setCarrinho([]); setDesconto(0); setClienteId(''); setPagamento('dinheiro'); setBusca('');
      // Recarrega resultados para refletir o novo estoque.
      api.get('/produtos?ativos=1').then((r) => setResultados(r.slice(0, 30)));
    } catch (err) { setErro(err.message); }
  }

  return (
    <>
      <div className="page-header">
        <div><h1>PDV — Ponto de Venda</h1><p>Registre as vendas do caixa</p></div>
      </div>

      {erro && <div className="erro-msg">{erro}</div>}
      {sucesso && (
        <div className="ok-msg flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{sucesso}</span>
          {ultimaVenda && (
            <button className="btn secundario pequeno" onClick={() => setCupomAberto(true)}>Ver cupom</button>
          )}
        </div>
      )}

      <div className="pdv-layout">
        {/* Coluna: busca de produtos */}
        <div className="card">
          <form className="bipe-box" onSubmit={biparCodigo}>
            <span className="bipe-icone">📷</span>
            <input
              ref={codigoRef}
              className="bipe-input"
              placeholder="Bipe ou digite o código de barras e tecle Enter"
              value={codigo}
              autoFocus
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button type="submit" className="btn pequeno">Adicionar</button>
          </form>
          {bipeMsg && (
            <div className={bipeMsg.ok ? 'bipe-msg ok' : 'bipe-msg erro'}>{bipeMsg.texto}</div>
          )}

          <div className="section-title" style={{ marginTop: 16 }}>Ou busque por nome</div>
          <input placeholder="Buscar produto por nome ou código..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="pdv-resultados mt">
            {resultados.length === 0 ? <div className="vazio">Nenhum produto.</div> :
              resultados.map((p) => (
                <div key={p.id} className="produto-item" onClick={() => adicionar(p)}>
                  <div>
                    <strong>{p.nome}</strong><br />
                    <small>{brl(p.preco_venda)} · estoque: {p.estoque} {p.unidade}</small>
                  </div>
                  <button className="btn pequeno">+ Adicionar</button>
                </div>
              ))}
          </div>
        </div>

        {/* Coluna: carrinho */}
        <div className="card">
          <div className="section-title">Carrinho ({carrinho.length})</div>
          {carrinho.length === 0 ? <div className="vazio">Carrinho vazio.</div> : (
            <table>
              <thead><tr><th>Item</th><th className="num">Qtd</th><th className="num">Subtotal</th><th></th></tr></thead>
              <tbody>
                {carrinho.map((i) => (
                  <tr key={i.produto_id}>
                    <td>{i.nome}<br /><small style={{ color: '#6b7280' }}>{brl(i.preco_unitario)}/{i.unidade}</small></td>
                    <td className="num">
                      <input className="qtd-input" type="number" min="0" step="0.001" value={i.quantidade} onChange={(e) => mudarQtd(i.produto_id, e.target.value)} />
                    </td>
                    <td className="num">{brl(i.preco_unitario * i.quantidade)}</td>
                    <td className="num"><button className="btn-link perigo" onClick={() => remover(i.produto_id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt">
            <div className="form-grid">
              <div>
                <label>Cliente</label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Consumidor final</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label>Pagamento</label>
                <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div>
                <label>Desconto (R$)</label>
                <input type="number" min="0" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
              </div>
            </div>

            <div className="flex mt" style={{ justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>Subtotal: {brl(subtotal)}</div>
                <div className="carrinho-total">{brl(total)}</div>
              </div>
              <button className="btn" style={{ padding: '14px 28px', fontSize: 16 }} disabled={carrinho.length === 0} onClick={finalizar}>
                Finalizar venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {cupomAberto && <Cupom venda={ultimaVenda} onFechar={() => setCupomAberto(false)} />}
    </>
  );
}
