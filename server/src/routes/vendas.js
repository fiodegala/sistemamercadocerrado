import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Lista vendas (resumo), com filtro opcional por data (?de=YYYY-MM-DD&ate=YYYY-MM-DD).
router.get('/', (req, res) => {
  const { de, ate } = req.query;
  const where = [];
  const params = {};
  if (de) { where.push("date(v.criado_em) >= @de"); params.de = de; }
  if (ate) { where.push("date(v.criado_em) <= @ate"); params.ate = ate; }
  const sql = `
    SELECT v.*, c.nome AS cliente_nome,
      (SELECT COUNT(*) FROM venda_itens vi WHERE vi.venda_id = v.id) AS qtd_itens
    FROM vendas v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY v.criado_em DESC
    LIMIT 200
  `;
  res.json(db.prepare(sql).all(params));
});

// Detalhe de uma venda com itens.
router.get('/:id', (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
  venda.itens = db.prepare('SELECT * FROM venda_itens WHERE venda_id = ?').all(venda.id);
  res.json(venda);
});

// Registra uma venda: valida estoque, grava itens, dá baixa no estoque e
// registra a movimentação — tudo dentro de uma transação atômica.
router.post('/', (req, res) => {
  const { cliente_id = null, desconto = 0, forma_pagamento = 'dinheiro', itens = [] } = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'A venda precisa de ao menos um item' });
  }

  const registrar = db.transaction(() => {
    let subtotal = 0;
    const preparados = [];

    for (const item of itens) {
      const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(item.produto_id);
      if (!produto) throw Object.assign(new Error(`Produto ${item.produto_id} não existe`), { status: 400 });
      const quantidade = Number(item.quantidade);
      if (!(quantidade > 0)) throw Object.assign(new Error(`Quantidade inválida para ${produto.nome}`), { status: 400 });
      if (produto.estoque < quantidade) {
        throw Object.assign(new Error(`Estoque insuficiente de ${produto.nome} (disponível: ${produto.estoque})`), { status: 409 });
      }
      const preco = item.preco_unitario != null ? Number(item.preco_unitario) : produto.preco_venda;
      const totalItem = preco * quantidade;
      subtotal += totalItem;
      preparados.push({ produto, quantidade, preco, totalItem });
    }

    const desc = Number(desconto) || 0;
    const total = Math.max(0, subtotal - desc);

    const vendaInfo = db.prepare(`
      INSERT INTO vendas (cliente_id, subtotal, desconto, total, forma_pagamento)
      VALUES (?, ?, ?, ?, ?)
    `).run(cliente_id, subtotal, desc, total, forma_pagamento);
    const vendaId = vendaInfo.lastInsertRowid;

    const insItem = db.prepare(`
      INSERT INTO venda_itens (venda_id, produto_id, descricao, quantidade, preco_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const baixaEstoque = db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?');
    const insMov = db.prepare(`
      INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo)
      VALUES (?, 'saida', ?, ?)
    `);

    for (const p of preparados) {
      insItem.run(vendaId, p.produto.id, p.produto.nome, p.quantidade, p.preco, p.totalItem);
      baixaEstoque.run(p.quantidade, p.produto.id);
      insMov.run(p.produto.id, p.quantidade, `Venda #${vendaId}`);
    }

    return vendaId;
  });

  try {
    const vendaId = registrar();
    const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(vendaId);
    venda.itens = db.prepare('SELECT * FROM venda_itens WHERE venda_id = ?').all(vendaId);
    res.status(201).json(venda);
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.message });
  }
});

export default router;
