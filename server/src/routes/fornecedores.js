import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    return res.json(
      db.prepare('SELECT * FROM fornecedores WHERE nome LIKE ? OR cnpj LIKE ? ORDER BY nome')
        .all(`%${q}%`, `%${q}%`)
    );
  }
  res.json(db.prepare('SELECT * FROM fornecedores ORDER BY nome').all());
});

function normalizar(b) {
  return {
    nome: b.nome?.trim(),
    cnpj: b.cnpj?.trim() || null,
    telefone: b.telefone?.trim() || null,
    email: b.email?.trim() || null,
  };
}

router.post('/', (req, res) => {
  const f = normalizar(req.body);
  if (!f.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  const info = db.prepare(`
    INSERT INTO fornecedores (nome, cnpj, telefone, email)
    VALUES (@nome, @cnpj, @telefone, @email)
  `).run(f);
  res.status(201).json(db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM fornecedores WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ erro: 'Fornecedor não encontrado' });
  const f = normalizar(req.body);
  if (!f.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  db.prepare(`
    UPDATE fornecedores SET nome=@nome, cnpj=@cnpj, telefone=@telefone, email=@email WHERE id=@id
  `).run({ ...f, id: req.params.id });
  res.json(db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM fornecedores WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
