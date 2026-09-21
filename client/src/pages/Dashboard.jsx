import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { api, brl } from '../api.js';

const CORES = ['#2e7d32', '#66bb6a', '#f59e0b', '#0ea5e9', '#8b5cf6'];

export default function Dashboard() {
  const [dados, setDados] = useState(null);

  useEffect(() => { api.get('/relatorios/dashboard').then(setDados).catch(() => {}); }, []);

  if (!dados) return <div className="vazio">Carregando...</div>;

  const { hoje, mes, totais, vendas7dias, topProdutos, valorEstoque } = dados;
  const serie = vendas7dias.map((d) => ({
    dia: new Date(d.dia + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    faturamento: d.faturamento,
  }));

  return (
    <>
      <div className="page-header">
        <div><h1>Dashboard</h1><p>Visão geral do mercado</p></div>
      </div>

      <div className="kpi-grid">
        <div className="kpi destaque">
          <div className="kpi-label">Faturamento hoje</div>
          <div className="kpi-value">{brl(hoje.faturamento)}</div>
          <div className="kpi-sub">{hoje.vendas} venda(s)</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Faturamento no mês</div>
          <div className="kpi-value">{brl(mes.faturamento)}</div>
          <div className="kpi-sub">{mes.vendas} venda(s)</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Produtos ativos</div>
          <div className="kpi-value">{totais.produtos}</div>
          <div className="kpi-sub">{totais.clientes} cliente(s)</div>
        </div>
        <div className={`kpi ${totais.alertas > 0 ? 'alerta' : ''}`}>
          <div className="kpi-label">Alertas de estoque</div>
          <div className="kpi-value">{totais.alertas}</div>
          <div className="kpi-sub">produto(s) abaixo do mínimo</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Faturamento — últimos 7 dias</div>
          {serie.length === 0 ? <div className="vazio">Sem vendas no período.</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => brl(v)} />
                <Bar dataKey="faturamento" fill="#2e7d32" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-title">Top 5 produtos mais vendidos</div>
          {topProdutos.length === 0 ? <div className="vazio">Sem dados de vendas.</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={topProdutos} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%" outerRadius={90} label={(e) => e.nome.split(' ')[0]}>
                  {topProdutos.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v} un`, p.payload.nome]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card mt">
        <div className="section-title">Valor do estoque</div>
        <div className="flex" style={{ gap: 40 }}>
          <div>
            <div className="kpi-label">A preço de custo</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(valorEstoque.custo)}</div>
          </div>
          <div>
            <div className="kpi-label">A preço de venda</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2e7d32' }}>{brl(valorEstoque.venda)}</div>
          </div>
          <div>
            <div className="kpi-label">Margem potencial</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{brl(valorEstoque.venda - valorEstoque.custo)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
