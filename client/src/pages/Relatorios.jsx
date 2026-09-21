import { useEffect, useState } from 'react';
import { api, brl } from '../api.js';
import Cupom from '../components/Cupom.jsx';

function hojeISO() { return new Date().toISOString().slice(0, 10); }
function inicioMesISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }

const PAGAMENTO_LABEL = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito' };

export default function Relatorios() {
  const [de, setDe] = useState(inicioMesISO());
  const [ate, setAte] = useState(hojeISO());
  const [relatorio, setRelatorio] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [cupomVenda, setCupomVenda] = useState(null);

  async function abrirCupom(id) {
    try { setCupomVenda(await api.get(`/vendas/${id}`)); } catch { /* ignore */ }
  }

  async function carregar() {
    const [rel, lista] = await Promise.all([
      api.get(`/relatorios/vendas?de=${de}&ate=${ate}`),
      api.get(`/vendas?de=${de}&ate=${ate}`),
    ]);
    setRelatorio(rel); setVendas(lista);
  }
  useEffect(() => { carregar(); }, []);

  return (
    <>
      <div className="page-header">
        <div><h1>Relatórios</h1><p>Vendas por período</p></div>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div><label>De</label><input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></div>
          <div><label>Até</label><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
          <div style={{ alignSelf: 'flex-end' }}><button className="btn" onClick={carregar}>Aplicar</button></div>
        </div>
      </div>

      {relatorio && (
        <>
          <div className="kpi-grid mt">
            <div className="kpi destaque">
              <div className="kpi-label">Faturamento no período</div>
              <div className="kpi-value">{brl(relatorio.resumo.faturamento)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Vendas</div>
              <div className="kpi-value">{relatorio.resumo.vendas}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Descontos concedidos</div>
              <div className="kpi-value">{brl(relatorio.resumo.descontos)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Ticket médio</div>
              <div className="kpi-value">{brl(relatorio.resumo.vendas ? relatorio.resumo.faturamento / relatorio.resumo.vendas : 0)}</div>
            </div>
          </div>

          <div className="grid-2 mt">
            <div className="card">
              <div className="section-title">Por forma de pagamento</div>
              {relatorio.porPagamento.length === 0 ? <div className="vazio">Sem vendas.</div> : (
                <table>
                  <thead><tr><th>Forma</th><th className="num">Vendas</th><th className="num">Faturamento</th></tr></thead>
                  <tbody>
                    {relatorio.porPagamento.map((p) => (
                      <tr key={p.forma_pagamento}>
                        <td>{PAGAMENTO_LABEL[p.forma_pagamento] || p.forma_pagamento}</td>
                        <td className="num">{p.vendas}</td>
                        <td className="num">{brl(p.faturamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <div className="section-title">Vendas no período ({vendas.length})</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {vendas.length === 0 ? <div className="vazio">Nenhuma venda.</div> : (
                  <table>
                    <thead><tr><th>#</th><th>Data</th><th>Cliente</th><th className="num">Total</th><th></th></tr></thead>
                    <tbody>
                      {vendas.map((v) => (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td><small>{v.criado_em}</small></td>
                          <td>{v.cliente_nome || 'Consumidor final'}</td>
                          <td className="num">{brl(v.total)}</td>
                          <td className="num"><button className="btn-link" onClick={() => abrirCupom(v.id)}>Cupom</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {cupomVenda && <Cupom venda={cupomVenda} onFechar={() => setCupomVenda(null)} />}
    </>
  );
}
