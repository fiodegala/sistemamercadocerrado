# 🌿 Sistema Mercado Cerrado

Sistema de gestão para mercado / mercearia, com **PDV (caixa)**, **controle de estoque**,
**cadastros** (produtos, clientes, fornecedores) e **dashboard com relatórios**.

Aplicação web full-stack: **Node + Express + SQLite** no backend e **React + Vite** no frontend.

---

## ✨ Funcionalidades (MVP)

- **PDV / Vendas** — busca de produtos, carrinho, desconto, forma de pagamento e
  finalização com baixa automática de estoque (transação atômica).
- **Controle de estoque** — movimentações de entrada/saída/ajuste, histórico e
  alertas de estoque abaixo do mínimo.
- **Cadastros** — produtos (com categorias, preços e código de barras), clientes e fornecedores.
- **Dashboard** — faturamento do dia/mês, gráfico dos últimos 7 dias, top 5 produtos
  mais vendidos e valor total do estoque.
- **Relatórios** — vendas por período, ticket médio e resumo por forma de pagamento.

---

## 🚀 Como rodar

Pré-requisito: **Node.js 20+**.

```bash
# 1. Instalar as dependências (backend + frontend via workspaces)
npm install

# 2. (Opcional) Popular o banco com dados de exemplo
npm run seed

# 3. Subir backend (porta 3001) e frontend (porta 5173) juntos
npm run dev
```

Abra **http://localhost:5173** no navegador.

> Para rodar separadamente: `npm run dev:server` e `npm run dev:client`.

O banco de dados é um arquivo SQLite criado automaticamente em `server/data/mercado.db`
(fora do controle de versão).

---

## 🗂️ Estrutura

```
sistemamercadocerrado/
├── package.json          # workspaces + scripts (dev, seed, build)
├── server/               # API Express + SQLite
│   └── src/
│       ├── index.js      # servidor e rotas
│       ├── db.js         # conexão SQLite (better-sqlite3)
│       ├── schema.sql    # schema do banco
│       ├── seed.js       # dados de exemplo
│       └── routes/       # produtos, categorias, clientes, fornecedores, vendas, estoque, relatorios
└── client/               # SPA React + Vite
    └── src/
        ├── App.jsx       # layout + rotas
        ├── api.js        # cliente HTTP
        ├── components/   # Modal
        └── pages/        # Dashboard, PDV, Produtos, Estoque, Clientes, Fornecedores, Relatorios
```

---

## 🔌 API (resumo)

| Método | Rota                          | Descrição                              |
|--------|-------------------------------|----------------------------------------|
| GET    | `/api/produtos?q=`            | Lista/busca produtos                   |
| POST   | `/api/produtos`               | Cria produto                           |
| PUT    | `/api/produtos/:id`           | Atualiza produto                       |
| GET    | `/api/categorias`             | Lista categorias                       |
| GET    | `/api/clientes?q=`            | Lista/busca clientes                   |
| GET    | `/api/fornecedores?q=`        | Lista/busca fornecedores               |
| POST   | `/api/vendas`                 | Registra venda (baixa estoque)         |
| GET    | `/api/vendas?de=&ate=`        | Lista vendas por período               |
| GET    | `/api/estoque/alertas`        | Produtos abaixo do mínimo              |
| POST   | `/api/estoque/movimentacoes`  | Entrada/saída/ajuste de estoque        |
| GET    | `/api/relatorios/dashboard`   | KPIs e séries do dashboard             |
| GET    | `/api/relatorios/vendas`      | Relatório de vendas por período        |

---

## 🛣️ Próximos passos sugeridos

- Autenticação e perfis de usuário (operador de caixa vs. administrador)
- Impressão de cupom / recibo da venda
- Leitura de código de barras via scanner
- Contas a pagar/receber e fluxo de caixa
- Exportação de relatórios (PDF/Excel)
