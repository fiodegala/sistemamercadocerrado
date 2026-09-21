-- Schema do Sistema Mercado Cerrado
-- SQLite. Todas as tabelas usam IF NOT EXISTS para permitir boot idempotente.

CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  usuario    TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil     TEXT NOT NULL DEFAULT 'caixa',   -- admin, caixa
  ativo      INTEGER NOT NULL DEFAULT 1,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS produtos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras  TEXT UNIQUE,
  nome           TEXT NOT NULL,
  categoria_id   INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  unidade        TEXT NOT NULL DEFAULT 'un',          -- un, kg, L, cx...
  preco_custo    REAL NOT NULL DEFAULT 0,
  preco_venda    REAL NOT NULL DEFAULT 0,
  estoque        REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  ativo          INTEGER NOT NULL DEFAULT 1,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  cpf        TEXT,
  telefone   TEXT,
  email      TEXT,
  endereco   TEXT,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  cnpj       TEXT,
  telefone   TEXT,
  email      TEXT,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id      INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  subtotal        REAL NOT NULL DEFAULT 0,
  desconto        REAL NOT NULL DEFAULT 0,
  total           REAL NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL DEFAULT 'dinheiro',    -- dinheiro, credito, debito, pix
  criado_em       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS venda_itens (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id       INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id     INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  descricao      TEXT NOT NULL,
  quantidade     REAL NOT NULL,
  preco_unitario REAL NOT NULL,
  subtotal       REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id  INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,                            -- entrada, saida, ajuste
  quantidade  REAL NOT NULL,
  motivo      TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_produtos_nome    ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo  ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_vendas_data      ON vendas(criado_em);
CREATE INDEX IF NOT EXISTS idx_venda_itens_venda ON venda_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto      ON movimentacoes_estoque(produto_id);
