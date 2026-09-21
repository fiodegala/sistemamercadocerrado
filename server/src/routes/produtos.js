import { Router } from 'express';
import db from '../db.js';

const router = Router();

const SELECT = `
  SELECT p.*, c.nome AS categoria_nome
  FROM produtos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

// Lista produtos, com busca opcional (?q=) por nome ou código de barras.
router.get('/', (req, res) => {
  const { q, ativos } = req.query;
  const where = [];
  const params = {};
  if (q) {
    where.push('(p.nome LIKE @q OR p.codigo_barras LIKE @q)');
    params.q = `%${q}%`;
  }
  if (ativos === '1') where.push('p.ativo = 1');
  const sql = SELECT + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY p.nome';
  res.json(db.prepare(sql).all(params));
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`${SELECT} WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(row);
});

function normalizar(body) {
  return {
    codigo_barras: body.codigo_barras?.trim() || null,
    nome: body.nome?.trim(),
    categoria_id: body.categoria_id || null,
    unidade: body.unidade?.trim() || 'un',
    preco_custo: Number(body.preco_custo) || 0,
    preco_venda: Number(body.preco_venda) || 0,
    estoque: Number(body.estoque) || 0,
    estoque_minimo: Number(body.estoque_minimo) || 0,
    ativo: body.ativo === undefined ? 1 : body.ativo ? 1 : 0,
  };
}

router.post('/', (req, res) => {
  const p = normalizar(req.body);
  if (!p.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const info = db.prepare(`
      INSERT INTO produtos (codigo_barras, nome, categoria_id, unidade, preco_custo, preco_venda, estoque, estoque_minimo, ativo)
      VALUES (@codigo_barras, @nome, @categoria_id, @unidade, @preco_custo, @preco_venda, @estoque, @estoque_minimo, @ativo)
    `).run(p);
    res.status(201).json(db.prepare(`${SELECT} WHERE p.id = ?`).get(info.lastInsertRowid));
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ erro: 'Código de barras já cadastrado' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM produtos WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ erro: 'Produto não encontrado' });
  const p = normalizar(req.body);
  if (!p.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    db.prepare(`
      UPDATE produtos SET
        codigo_barras = @codigo_barras, nome = @nome, categoria_id = @categoria_id,
        unidade = @unidade, preco_custo = @preco_custo, preco_venda = @preco_venda,
        estoque = @estoque, estoque_minimo = @estoque_minimo, ativo = @ativo
      WHERE id = @id
    `).run({ ...p, id: req.params.id });
    res.json(db.prepare(`${SELECT} WHERE p.id = ?`).get(req.params.id));
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ erro: 'Código de barras já cadastrado' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
