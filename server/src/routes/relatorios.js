import { Router } from 'express';
import db from '../db.js';

const router = Router();

// KPIs e séries para o dashboard.
router.get('/dashboard', (_req, res) => {
  const hoje = db.prepare(`
    SELECT COUNT(*) AS vendas, COALESCE(SUM(total), 0) AS faturamento
    FROM vendas WHERE date(criado_em) = date('now', 'localtime')
  `).get();

  const mes = db.prepare(`
    SELECT COUNT(*) AS vendas, COALESCE(SUM(total), 0) AS faturamento
    FROM vendas WHERE strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', 'localtime')
  `).get();

  const totais = {
    produtos: db.prepare('SELECT COUNT(*) AS n FROM produtos WHERE ativo = 1').get().n,
    clientes: db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n,
    alertas: db.prepare('SELECT COUNT(*) AS n FROM produtos WHERE ativo = 1 AND estoque <= estoque_minimo').get().n,
  };

  // Faturamento dos últimos 7 dias.
  const vendas7dias = db.prepare(`
    SELECT date(criado_em) AS dia, COALESCE(SUM(total), 0) AS faturamento, COUNT(*) AS vendas
    FROM vendas
    WHERE date(criado_em) >= date('now', 'localtime', '-6 days')
    GROUP BY dia ORDER BY dia
  `).all();

  // Top 5 produtos mais vendidos (por quantidade).
  const topProdutos = db.prepare(`
    SELECT vi.descricao AS nome, SUM(vi.quantidade) AS quantidade, SUM(vi.subtotal) AS faturamento
    FROM venda_itens vi
    GROUP BY vi.descricao
    ORDER BY quantidade DESC
    LIMIT 5
  `).all();

  const valorEstoque = db.prepare(`
    SELECT COALESCE(SUM(estoque * preco_custo), 0) AS custo,
           COALESCE(SUM(estoque * preco_venda), 0) AS venda
    FROM produtos WHERE ativo = 1
  `).get();

  res.json({ hoje, mes, totais, vendas7dias, topProdutos, valorEstoque });
});

// Relatório de vendas por período com formas de pagamento.
router.get('/vendas', (req, res) => {
  const { de, ate } = req.query;
  const where = [];
  const params = {};
  if (de) { where.push("date(criado_em) >= @de"); params.de = de; }
  if (ate) { where.push("date(criado_em) <= @ate"); params.ate = ate; }
  const filtro = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const resumo = db.prepare(`
    SELECT COUNT(*) AS vendas, COALESCE(SUM(total), 0) AS faturamento,
           COALESCE(SUM(desconto), 0) AS descontos
    FROM vendas ${filtro}
  `).get(params);

  const porPagamento = db.prepare(`
    SELECT forma_pagamento, COUNT(*) AS vendas, COALESCE(SUM(total), 0) AS faturamento
    FROM vendas ${filtro}
    GROUP BY forma_pagamento ORDER BY faturamento DESC
  `).all(params);

  res.json({ resumo, porPagamento });
});

export default router;
