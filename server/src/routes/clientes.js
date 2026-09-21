import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    return res.json(
      db.prepare('SELECT * FROM clientes WHERE nome LIKE ? OR cpf LIKE ? ORDER BY nome')
        .all(`%${q}%`, `%${q}%`)
    );
  }
  res.json(db.prepare('SELECT * FROM clientes ORDER BY nome').all());
});

function normalizar(b) {
  return {
    nome: b.nome?.trim(),
    cpf: b.cpf?.trim() || null,
    telefone: b.telefone?.trim() || null,
    email: b.email?.trim() || null,
    endereco: b.endereco?.trim() || null,
  };
}

router.post('/', (req, res) => {
  const c = normalizar(req.body);
  if (!c.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  const info = db.prepare(`
    INSERT INTO clientes (nome, cpf, telefone, email, endereco)
    VALUES (@nome, @cpf, @telefone, @email, @endereco)
  `).run(c);
  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existe = db.prepare('SELECT id FROM clientes WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ erro: 'Cliente não encontrado' });
  const c = normalizar(req.body);
  if (!c.nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  db.prepare(`
    UPDATE clientes SET nome=@nome, cpf=@cpf, telefone=@telefone, email=@email, endereco=@endereco
    WHERE id=@id
  `).run({ ...c, id: req.params.id });
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
