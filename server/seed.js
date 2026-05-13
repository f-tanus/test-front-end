/**
 * SEED SCRIPT - Queijaria Corp
 * Inicializa o banco JSON com dados de exemplo
 *
 * Uso: npm run seed  (no diretório server/)
 * Ou:  node seed.js
 */
require('dotenv').config();
const { DB } = require('./config/database');

const produtosData = [
    { nome: 'Mussarela', tipo: 'Frescal', quantidade: 150, unidade: 'kg', precoVenda: 32.90, custoProducao: 18.50, status: 'ativo' },
    { nome: 'Prato', tipo: 'Frescal', quantidade: 80, unidade: 'kg', precoVenda: 28.50, custoProducao: 16.00, status: 'ativo' },
    { nome: 'Parmesão', tipo: 'Curado', quantidade: 45, unidade: 'kg', precoVenda: 58.90, custoProducao: 35.00, status: 'ativo' },
    { nome: 'Gorgonzola', tipo: 'Azul', quantidade: 20, unidade: 'kg', precoVenda: 65.00, custoProducao: 38.00, status: 'ativo' },
    { nome: 'Ricota', tipo: 'Frescal', quantidade: 60, unidade: 'kg', precoVenda: 22.00, custoProducao: 10.00, status: 'ativo' },
    { nome: 'Brie', tipo: 'Macio', quantidade: 15, unidade: 'kg', precoVenda: 85.00, custoProducao: 48.00, status: 'inativo' },
    { nome: 'Provolone', tipo: 'Curado', quantidade: 35, unidade: 'kg', precoVenda: 45.00, custoProducao: 25.00, status: 'ativo' },
    { nome: 'Requeijão', tipo: 'Processado', quantidade: 200, unidade: 'un', precoVenda: 12.50, custoProducao: 5.80, status: 'ativo' },
];

const materiaisData = [
    { nome: 'Leite Integral', categoria: 'Matéria-Prima', quantidade: 5000, unidade: 'L', estoqueMinimo: 2000, custoUnidade: 2.80, fornecedor: 'Laticínios Vale Verde', status: 'ativo' },
    { nome: 'Sal', categoria: 'Insumo', quantidade: 300, unidade: 'kg', estoqueMinimo: 100, custoUnidade: 1.50, fornecedor: 'Comercial Salinas', status: 'ativo' },
    { nome: 'Coalho', categoria: 'Insumo', quantidade: 50, unidade: 'L', estoqueMinimo: 10, custoUnidade: 45.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
    { nome: 'Fermento Lático', categoria: 'Insumo', quantidade: 25, unidade: 'kg', estoqueMinimo: 5, custoUnidade: 120.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
    { nome: 'Cloreto de Cálcio', categoria: 'Insumo', quantidade: 15, unidade: 'L', estoqueMinimo: 5, custoUnidade: 38.00, fornecedor: 'Química Brasil', status: 'ativo' },
    { nome: 'Embalagem Plástica', categoria: 'Embalagem', quantidade: 5000, unidade: 'un', estoqueMinimo: 1000, custoUnidade: 0.45, fornecedor: 'Embalar+', status: 'ativo' },
    { nome: 'Rótulos Personalizados', categoria: 'Embalagem', quantidade: 3000, unidade: 'un', estoqueMinimo: 500, custoUnidade: 0.80, fornecedor: 'Gráfica Rápida', status: 'ativo' },
    { nome: 'Caixa Papelão', categoria: 'Embalagem', quantidade: 800, unidade: 'un', estoqueMinimo: 200, custoUnidade: 2.50, fornecedor: 'Embalar+', status: 'ativo' },
    { nome: 'Rennet', categoria: 'Insumo', quantidade: 8, unidade: 'L', estoqueMinimo: 3, custoUnidade: 95.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
    { nome: 'Corante Natural', categoria: 'Insumo', quantidade: 12, unidade: 'L', estoqueMinimo: 4, custoUnidade: 55.00, fornecedor: 'Química Brasil', status: 'ativo' },
    { nome: 'Vinagre', categoria: 'Insumo', quantidade: 60, unidade: 'L', estoqueMinimo: 20, custoUnidade: 4.00, fornecedor: 'Comercial Salinas', status: 'inativo' },
    { nome: 'Caixa Térmica', categoria: 'Logística', quantidade: 40, unidade: 'un', estoqueMinimo: 10, custoUnidade: 35.00, fornecedor: 'LogiBox', status: 'ativo' },
];

function seed() {
    console.log('\n==============================');
    console.log('  QUEIJARIA CORP - SEED');
    console.log('==============================\n');

    // Clear existing data
    DB.clear('produtos');
    DB.clear('materiais');
    DB.clear('vendas');
    console.log('  ✓ Dados anteriores removidos\n');

    // Insert produtos
    const produtosCriados = DB.insertMany('produtos', produtosData);
    console.log(`  ✓ ${produtosCriados.length} produtos inseridos`);

    // Insert materiais
    const materiaisCriados = DB.insertMany('materiais', materiaisData);
    console.log(`  ✓ ${materiaisCriados.length} materiais inseridos`);

    // Helper to find produto by nome
    const getProd = (nome) => produtosCriados.find(p => p.nome === nome);

    // Build vendas
    const vendasData = [{
            cliente: 'Supermercado Bom Preço',
            itens: [
                { produtoId: getProd('Mussarela')._id, quantidade: 30, precoUnitario: 32.90 },
                { produtoId: getProd('Prato')._id, quantidade: 15, precoUnitario: 28.50 },
            ],
            total: 30 * 32.90 + 15 * 28.50,
            formaPagamento: 'Boleto',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 1).toISOString()
        },
        {
            cliente: 'Restaurante Sabor Campestre',
            itens: [
                { produtoId: getProd('Mussarela')._id, quantidade: 10, precoUnitario: 32.90 },
                { produtoId: getProd('Ricota')._id, quantidade: 8, precoUnitario: 22.00 },
            ],
            total: 10 * 32.90 + 8 * 22.00,
            formaPagamento: 'Pix',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 2).toISOString()
        },
        {
            cliente: 'Padaria Pão & Queijo',
            itens: [
                { produtoId: getProd('Requeijão')._id, quantidade: 50, precoUnitario: 12.50 },
                { produtoId: getProd('Provolone')._id, quantidade: 5, precoUnitario: 45.00 },
            ],
            total: 50 * 12.50 + 5 * 45.00,
            formaPagamento: 'Cartão',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 3).toISOString()
        },
        {
            cliente: 'Mercado da Cidade',
            itens: [
                { produtoId: getProd('Parmesão')._id, quantidade: 8, precoUnitario: 58.90 },
                { produtoId: getProd('Gorgonzola')._id, quantidade: 3, precoUnitario: 65.00 },
            ],
            total: 8 * 58.90 + 3 * 65.00,
            formaPagamento: 'Pix',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 5).toISOString()
        },
        {
            cliente: 'Empório Fine Cheese',
            itens: [
                { produtoId: getProd('Parmesão')._id, quantidade: 5, precoUnitario: 58.90 },
                { produtoId: getProd('Gorgonzola')._id, quantidade: 4, precoUnitario: 65.00 },
                { produtoId: getProd('Provolone')._id, quantidade: 3, precoUnitario: 45.00 },
            ],
            total: 5 * 58.90 + 4 * 65.00 + 3 * 45.00,
            formaPagamento: 'Cartão',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 7).toISOString()
        },
        {
            cliente: 'Supermercado Bom Preço',
            itens: [
                { produtoId: getProd('Mussarela')._id, quantidade: 20, precoUnitario: 32.90 },
                { produtoId: getProd('Prato')._id, quantidade: 10, precoUnitario: 28.50 },
                { produtoId: getProd('Requeijão')._id, quantidade: 30, precoUnitario: 12.50 },
            ],
            total: 20 * 32.90 + 10 * 28.50 + 30 * 12.50,
            formaPagamento: 'Boleto',
            status: 'pendente',
            dataVenda: new Date(2026, 4, 8).toISOString()
        },
        {
            cliente: 'Restaurante Sabor Campestre',
            itens: [
                { produtoId: getProd('Ricota')._id, quantidade: 12, precoUnitario: 22.00 },
                { produtoId: getProd('Mussarela')._id, quantidade: 8, precoUnitario: 32.90 },
            ],
            total: 12 * 22.00 + 8 * 32.90,
            formaPagamento: 'Pix',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 10).toISOString()
        },
        {
            cliente: 'Padaria Pão & Queijo',
            itens: [
                { produtoId: getProd('Requeijão')._id, quantidade: 80, precoUnitario: 12.50 },
                { produtoId: getProd('Prato')._id, quantidade: 12, precoUnitario: 28.50 },
            ],
            total: 80 * 12.50 + 12 * 28.50,
            formaPagamento: 'Cartão',
            status: 'concluida',
            dataVenda: new Date(2026, 4, 11).toISOString()
        },
        {
            cliente: 'Mercado da Cidade',
            itens: [
                { produtoId: getProd('Mussarela')._id, quantidade: 15, precoUnitario: 32.90 },
                { produtoId: getProd('Provolone')._id, quantidade: 5, precoUnitario: 45.00 },
                { produtoId: getProd('Parmesão')._id, quantidade: 2, precoUnitario: 58.90 },
            ],
            total: 15 * 32.90 + 5 * 45.00 + 2 * 58.90,
            formaPagamento: 'Pix',
            status: 'pendente',
            dataVenda: new Date(2026, 4, 12).toISOString()
        },
    ];

    const vendasCriadas = DB.insertMany('vendas', vendasData);
    console.log(`  ✓ ${vendasCriadas.length} vendas inseridas`);

    // Update product stock based on concluded sales
    for (const venda of vendasData) {
        if (venda.status === 'concluida') {
            for (const item of venda.itens) {
                const produto = DB.findById('produtos', item.produtoId);
                if (produto) {
                    DB.updateById('produtos', item.produtoId, {
                        quantidade: (produto.quantidade || 0) - item.quantidade
                    });
                }
            }
        }
    }
    console.log('  ✓ Estoque atualizado com base nas vendas concluídas\n');

    console.log('  Resumo:');
    console.log('  - Produtos:  ' + produtosCriados.length);
    console.log('  - Materiais: ' + materiaisCriados.length);
    console.log('  - Vendas:    ' + vendasCriadas.length);
    console.log('');
    console.log('==============================');
    console.log('  Seed concluído com sucesso!');
    console.log('  Dados salvos em server/data/');
    console.log('==============================\n');
}

seed();