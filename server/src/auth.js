// Autenticação simples sem dependências externas.
// - Senhas: scrypt com salt aleatório (formato "salt:hash" em hex).
// - Token: payload em base64url assinado com HMAC-SHA256 (stateless).
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const SECRET = process.env.AUTH_SECRET || 'mercado-cerrado-dev-secret-troque-em-producao';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

export function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(senha), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarSenha(senha, armazenado) {
  if (!armazenado || !armazenado.includes(':')) return false;
  const [salt, hash] = armazenado.split(':');
  const alvo = Buffer.from(hash, 'hex');
  const calc = scryptSync(String(senha), salt, 64);
  return alvo.length === calc.length && timingSafeEqual(alvo, calc);
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function assinar(dados) {
  return createHmac('sha256', SECRET).update(dados).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function gerarToken(usuario) {
  const payload = { id: usuario.id, nome: usuario.nome, usuario: usuario.usuario, perfil: usuario.perfil, exp: Date.now() + TOKEN_TTL_MS };
  const corpo = b64url(JSON.stringify(payload));
  return `${corpo}.${assinar(corpo)}`;
}

export function verificarToken(token) {
  if (!token || !token.includes('.')) return null;
  const [corpo, assinatura] = token.split('.');
  if (assinar(corpo) !== assinatura) return null;
  try {
    const payload = JSON.parse(Buffer.from(corpo.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Middleware: exige token válido no header Authorization: Bearer <token>.
export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verificarToken(token);
  if (!payload) return res.status(401).json({ erro: 'Não autenticado' });
  req.usuario = payload;
  next();
}

// Middleware: libera GET para qualquer usuário autenticado, mas exige perfil
// admin para operações de escrita (POST/PUT/DELETE).
export function escritaSomenteAdmin(req, res, next) {
  if (req.method === 'GET') return next();
  if (req.usuario?.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas administradores podem alterar este cadastro' });
  }
  next();
}
