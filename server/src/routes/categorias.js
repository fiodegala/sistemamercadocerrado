import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categorias ORDER BY nome').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const info = db.prepare('INSERT INTO categorias (nome) VALUES (?)').run(nome.trim());
    res.status(201).json(db.prepare('SELECT * FROM categorias WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ erro: 'Categoria já existe' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
