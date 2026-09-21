// Popula o banco com dados de exemplo para testar o sistema rapidamente.
// Uso: npm run seed  (apaga e recria os dados de demonstração)
import db from './db.js';

console.log('Limpando dados existentes...');
db.exec(`
  DELETE FROM venda_itens;
  DELETE FROM vendas;
  DELETE FROM movimentacoes_estoque;
  DELETE FROM produtos;
  DELETE FROM categorias;
  DELETE FROM clientes;
  DELETE FROM fornecedores;
  DELETE FROM sqlite_sequence;
`);

const categorias = ['Hortifruti', 'Bebidas', 'Padaria', 'Limpeza', 'Laticínios', 'Mercearia'];
const insCat = db.prepare('INSERT INTO categorias (nome) VALUES (?)');
const catId = {};
for (const nome of categorias) catId[nome] = insCat.run(nome).lastInsertRowid;

const produtos = [
  ['7891000100101', 'Arroz Tipo 1 5kg', 'Mercearia', 'un', 18.9, 27.9, 40, 10],
  ['7891000100102', 'Feijão Carioca 1kg', 'Mercearia', 'un', 5.5, 8.99, 60, 15],
  ['7891000100103', 'Açúcar Refinado 1kg', 'Mercearia', 'un', 3.2, 5.49, 8, 12],
  ['7891000100201', 'Refrigerante Cola 2L', 'Bebidas', 'un', 5.9, 9.99, 50, 12],
  ['7891000100202', 'Água Mineral 500ml', 'Bebidas', 'un', 0.9, 2.5, 120, 24],
  ['7891000100203', 'Cerveja Lata 350ml', 'Bebidas', 'un', 2.6, 4.49, 200, 48],
  ['7891000100301', 'Pão Francês', 'Padaria', 'kg', 8.0, 14.9, 30, 5],
  ['7891000100302', 'Bolo de Chocolate', 'Padaria', 'un', 12.0, 24.9, 6, 3],
  ['7891000100401', 'Detergente Neutro 500ml', 'Limpeza', 'un', 1.8, 3.29, 70, 20],
  ['7891000100402', 'Sabão em Pó 1kg', 'Limpeza', 'un', 7.5, 12.9, 25, 10],
  ['7891000100501', 'Leite Integral 1L', 'Laticínios', 'un', 3.9, 5.99, 90, 24],
  ['7891000100502', 'Queijo Mussarela 500g', 'Laticínios', 'un', 18.0, 29.9, 4, 6],
  ['7891000100601', 'Banana Prata', 'Hortifruti', 'kg', 3.5, 6.99, 45, 10],
  ['7891000100602', 'Tomate', 'Hortifruti', 'kg', 4.0, 7.99, 35, 10],
  ['7891000100603', 'Batata', 'Hortifruti', 'kg', 3.0, 5.49, 55, 15],
];
const insProd = db.prepare(`
  INSERT INTO produtos (codigo_barras, nome, categoria_id, unidade, preco_custo, preco_venda, estoque, estoque_minimo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const prodIds = [];
for (const [cb, nome, cat, un, custo, venda, est, min] of produtos) {
  prodIds.push(insProd.run(cb, nome, catId[cat], un, custo, venda, est, min).lastInsertRowid);
}

const clientes = [
  ['Maria Silva', '111.222.333-44', '(61) 99999-0001', 'maria@email.com', 'QNM 10, Ceilândia'],
  ['João Pereira', '222.333.444-55', '(61) 99999-0002', 'joao@email.com', 'Setor Central'],
  ['Ana Souza', '333.444.555-66', '(61) 99999-0003', 'ana@email.com', 'Taguatinga Norte'],
];
const insCli = db.prepare('INSERT INTO clientes (nome, cpf, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)');
const cliIds = clientes.map((c) => insCli.run(...c).lastInsertRowid);

const fornecedores = [
  ['Distribuidora Cerrado LTDA', '12.345.678/0001-90', '(61) 3333-1000', 'contato@cerrado.com'],
  ['Atacadão do Planalto', '98.765.432/0001-10', '(61) 3333-2000', 'vendas@planalto.com'],
];
const insForn = db.prepare('INSERT INTO fornecedores (nome, cnpj, telefone, email) VALUES (?, ?, ?, ?)');
for (const f of fornecedores) insForn.run(...f);

// Algumas vendas de exemplo (hoje) para o dashboard não nascer vazio.
const criarVenda = db.transaction((itens, cliente_id, forma) => {
  let subtotal = 0;
  const preparados = itens.map(([idx, qtd]) => {
    const p = db.prepare('SELECT * FROM produtos WHERE id = ?').get(prodIds[idx]);
    const total = p.preco_venda * qtd;
    subtotal += total;
    return { p, qtd, total };
  });
  const vid = db.prepare(`
    INSERT INTO vendas (cliente_id, subtotal, desconto, total, forma_pagamento)
    VALUES (?, ?, 0, ?, ?)
  `).run(cliente_id, subtotal, subtotal, forma).lastInsertRowid;
  for (const { p, qtd, total } of preparados) {
    db.prepare(`INSERT INTO venda_itens (venda_id, produto_id, descricao, quantidade, preco_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)`).run(vid, p.id, p.nome, qtd, p.preco_venda, total);
    db.prepare('UPDATE produtos SET estoque = estoque - ? WHERE id = ?').run(qtd, p.id);
    db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo)
                VALUES (?, 'saida', ?, ?)`).run(p.id, qtd, `Venda #${vid}`);
  }
});

criarVenda([[0, 2], [3, 3], [10, 4]], cliIds[0], 'pix');
criarVenda([[5, 12], [4, 6]], cliIds[1], 'debito');
criarVenda([[12, 3], [13, 2], [1, 1]], cliIds[2], 'dinheiro');
criarVenda([[6, 1.5], [10, 2]], null, 'credito');

console.log('Seed concluído:');
console.log(`  ${categorias.length} categorias, ${produtos.length} produtos, ${clientes.length} clientes`);
console.log('  4 vendas de exemplo registradas.');
