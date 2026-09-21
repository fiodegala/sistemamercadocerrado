import express from 'express';
import cors from 'cors';

import produtos from './routes/produtos.js';
import categorias from './routes/categorias.js';
import clientes from './routes/clientes.js';
import fornecedores from './routes/fornecedores.js';
import vendas from './routes/vendas.js';
import estoque from './routes/estoque.js';
import relatorios from './routes/relatorios.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, servico: 'mercado-cerrado' }));

app.use('/api/produtos', produtos);
app.use('/api/categorias', categorias);
app.use('/api/clientes', clientes);
app.use('/api/fornecedores', fornecedores);
app.use('/api/vendas', vendas);
app.use('/api/estoque', estoque);
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
