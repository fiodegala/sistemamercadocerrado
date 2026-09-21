import express from 'express';
import cors from 'cors';

import auth from './routes/auth.js';
import produtos from './routes/produtos.js';
import categorias from './routes/categorias.js';
import clientes from './routes/clientes.js';
import fornecedores from './routes/fornecedores.js';
import vendas from './routes/vendas.js';
import estoque from './routes/estoque.js';
import relatorios from './routes/relatorios.js';
import { autenticar, escritaSomenteAdmin } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, servico: 'mercado-cerrado' }));

// Rotas públicas de autenticação (login).
app.use('/api/auth', auth);

// A partir daqui, tudo exige um token válido.
app.use('/api', autenticar);

// Escrita nos cadastros é restrita a administradores; caixa pode ler tudo e vender.
app.use('/api/produtos', escritaSomenteAdmin, produtos);
app.use('/api/categorias', escritaSomenteAdmin, categorias);
app.use('/api/clientes', escritaSomenteAdmin, clientes);
app.use('/api/fornecedores', escritaSomenteAdmin, fornecedores);
app.use('/api/estoque', escritaSomenteAdmin, estoque);
app.use('/api/vendas', vendas);        // caixa e admin podem registrar vendas
app.use('/api/relatorios', relatorios);

// Handler de erro centralizado.
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ erro: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API do Mercado Cerrado rodando em http://localhost:${PORT}`);
});
