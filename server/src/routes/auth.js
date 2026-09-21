import { Router } from 'express';
import db from '../db.js';
import { verificarSenha, gerarToken, autenticar } from '../auth.js';

const router = Router();

// Login: recebe { usuario, senha }, devolve token + dados do usuário.
router.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) return res.status(400).json({ erro: 'Informe usuário e senha' });
  const u = db.prepare('SELECT * FROM usuarios WHERE usuario = ? AND ativo = 1').get(String(usuario).trim());
  if (!u || !verificarSenha(senha, u.senha_hash)) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
  const token = gerarToken(u);
  res.json({ token, usuario: { id: u.id, nome: u.nome, usuario: u.usuario, perfil: u.perfil } });
});

// Retorna o usuário do token (para revalidar a sessão ao abrir o app).
router.get('/me', autenticar, (req, res) => {
  const u = db.prepare('SELECT id, nome, usuario, perfil FROM usuarios WHERE id = ? AND ativo = 1').get(req.usuario.id);
  if (!u) return res.status(401).json({ erro: 'Sessão inválida' });
  res.json({ usuario: u });
});

export default router;
