import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Produtos com estoque igual/abaixo do mínimo.
router.get('/alertas', (_req, res) => {
  res.json(db.prepare(`
    SELECT * FROM produtos
    WHERE ativo = 1 AND estoque <= estoque_minimo
    ORDER BY estoque ASC
  `).all());
});

// Histórico de movimentações (opcional ?produto_id=).
router.get('/movimentacoes', (req, res) => {
  const { produto_id } = req.query;
  const sql = `
    SELECT m.*, p.nome AS produto_nome
    FROM movimentacoes_estoque m
    JOIN produtos p ON p.id = m.produto_id
    ${produto_id ? 'WHERE m.produto_id = @produto_id' : ''}
    ORDER BY m.criado_em DESC
    LIMIT 200
  `;
  res.json(db.prepare(sql).all(produto_id ? { produto_id } : {}));
});

// Registra uma movimentação manual e ajusta o estoque do produto.
// tipo: 'entrada' (soma), 'saida' (subtrai), 'ajuste' (define valor absoluto).
router.post('/movimentacoes', (req, res) => {
  const { produto_id, tipo, quantidade, motivo } = req.body;
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produto_id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  const qtd = Number(quantidade);
  if (!Number.isFinite(qtd)) return res.status(400).json({ erro: 'Quantidade inválida' });
  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo deve ser entrada, saida ou ajuste' });
  }

  const executar = db.transaction(() => {
    let novoEstoque;
    if (tipo === 'entrada') novoEstoque = produto.estoque + qtd;
    else if (tipo === 'saida') novoEstoque = produto.estoque - qtd;
    else novoEstoque = qtd; // ajuste = valor absoluto
    if (novoEstoque < 0) throw Object.assign(new Error('Estoque não pode ficar negativo'), { status: 409 });

    db.prepare('UPDATE produtos SET estoque = ? WHERE id = ?').run(novoEstoque, produto.id);
    db.prepare(`
      INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo)
      VALUES (?, ?, ?, ?)
    `).run(produto.id, tipo, qtd, motivo?.trim() || null);
    return novoEstoque;
  });

  try {
    const estoque = executar();
    res.status(201).json({ produto_id: produto.id, estoque });
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.message });
  }
});

export default router;
