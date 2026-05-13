/* =======================================
   QUEIJARIA CORP - Data Layer
   ======================================= */

const DataStore = (() => {
    // ---------- Mock Data ----------
    const produtos = [
        { id: 1, nome: 'Mussarela', tipo: 'Frescal', quantidade: 150, unidade: 'kg', precoVenda: 32.90, custoProducao: 18.50, status: 'ativo', img: '&#x1F9C0;' },
        { id: 2, nome: 'Prato', tipo: 'Frescal', quantidade: 80, unidade: 'kg', precoVenda: 28.50, custoProducao: 16.00, status: 'ativo', img: '&#x1F9C0;' },
        { id: 3, nome: 'Parmesão', tipo: 'Curado', quantidade: 45, unidade: 'kg', precoVenda: 58.90, custoProducao: 35.00, status: 'ativo', img: '&#x1F9C0;' },
        { id: 4, nome: 'Gorgonzola', tipo: 'Azul', quantidade: 20, unidade: 'kg', precoVenda: 65.00, custoProducao: 38.00, status: 'ativo', img: '&#x1F9C0;' },
        { id: 5, nome: 'Ricota', tipo: 'Frescal', quantidade: 60, unidade: 'kg', precoVenda: 22.00, custoProducao: 10.00, status: 'ativo', img: '&#x1F9C0;' },
        { id: 6, nome: 'Brie', tipo: 'Macio', quantidade: 15, unidade: 'kg', precoVenda: 85.00, custoProducao: 48.00, status: 'inativo', img: '&#x1F9C0;' },
        { id: 7, nome: 'Provolone', tipo: 'Curado', quantidade: 35, unidade: 'kg', precoVenda: 45.00, custoProducao: 25.00, status: 'ativo', img: '&#x1F9C0;' },
        { id: 8, nome: 'Requeijão', tipo: 'Processado', quantidade: 200, unidade: 'un', precoVenda: 12.50, custoProducao: 5.80, status: 'ativo', img: '&#x1F9C0;' },
    ];

    const materiais = [
        { id: 1, nome: 'Leite Integral', categoria: 'Matéria-Prima', quantidade: 5000, unidade: 'L', estoqueMinimo: 2000, custoUnidade: 2.80, fornecedor: 'Laticínios Vale Verde', status: 'ativo' },
        { id: 2, nome: 'Sal', categoria: 'Insumo', quantidade: 300, unidade: 'kg', estoqueMinimo: 100, custoUnidade: 1.50, fornecedor: 'Comercial Salinas', status: 'ativo' },
        { id: 3, nome: 'Coalho', categoria: 'Insumo', quantidade: 50, unidade: 'L', estoqueMinimo: 10, custoUnidade: 45.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
        { id: 4, nome: 'Fermento Lático', categoria: 'Insumo', quantidade: 25, unidade: 'kg', estoqueMinimo: 5, custoUnidade: 120.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
        { id: 5, nome: 'Cloreto de Cálcio', categoria: 'Insumo', quantidade: 15, unidade: 'L', estoqueMinimo: 5, custoUnidade: 38.00, fornecedor: 'Química Brasil', status: 'ativo' },
        { id: 6, nome: 'Embalagem Plástica', categoria: 'Embalagem', quantidade: 5000, unidade: 'un', estoqueMinimo: 1000, custoUnidade: 0.45, fornecedor: 'Embalar+', status: 'ativo' },
        { id: 7, nome: 'Rótulos Personalizados', categoria: 'Embalagem', quantidade: 3000, unidade: 'un', estoqueMinimo: 500, custoUnidade: 0.80, fornecedor: 'Gráfica Rápida', status: 'ativo' },
        { id: 8, nome: 'Caixa Papelão', categoria: 'Embalagem', quantidade: 800, unidade: 'un', estoqueMinimo: 200, custoUnidade: 2.50, fornecedor: 'Embalar+', status: 'ativo' },
        { id: 9, nome: 'Rennet', categoria: 'Insumo', quantidade: 8, unidade: 'L', estoqueMinimo: 3, custoUnidade: 95.00, fornecedor: 'BioQuímica Ltda', status: 'ativo' },
        { id: 10, nome: 'Corante Natural', categoria: 'Insumo', quantidade: 12, unidade: 'L', estoqueMinimo: 4, custoUnidade: 55.00, fornecedor: 'Química Brasil', status: 'ativo' },
        { id: 11, nome: 'Vinagre', categoria: 'Insumo', quantidade: 60, unidade: 'L', estoqueMinimo: 20, custoUnidade: 4.00, fornecedor: 'Comercial Salinas', status: 'inativo' },
        { id: 12, nome: 'Caixa Térmica', categoria: 'Logística', quantidade: 40, unidade: 'un', estoqueMinimo: 10, custoUnidade: 35.00, fornecedor: 'LogiBox', status: 'ativo' },
    ];

    const vendas = [
        { id: 1, data: '2026-05-01', cliente: 'Supermercado Bom Preço', itens: [{ produtoId: 1, quantidade: 30 }, { produtoId: 2, quantidade: 15 }], total: 1429.50, formaPagamento: 'Boleto', status: 'concluida' },
        { id: 2, data: '2026-05-02', cliente: 'Restaurante Sabor Campestre', itens: [{ produtoId: 1, quantidade: 10 }, { produtoId: 5, quantidade: 8 }], total: 505.00, formaPagamento: 'Pix', status: 'concluida' },
        { id: 3, data: '2026-05-03', cliente: 'Padaria Pão & Queijo', itens: [{ produtoId: 8, quantidade: 50 }, { produtoId: 7, quantidade: 5 }], total: 850.00, formaPagamento: 'Cartão', status: 'concluida' },
        { id: 4, data: '2026-05-05', cliente: 'Mercado da Cidade', itens: [{ produtoId: 3, quantidade: 8 }, { produtoId: 4, quantidade: 3 }], total: 666.20, formaPagamento: 'Pix', status: 'concluida' },
        { id: 5, data: '2026-05-07', cliente: 'Empório Fine Cheese', itens: [{ produtoId: 3, quantidade: 5 }, { produtoId: 4, quantidade: 4 }, { produtoId: 7, quantidade: 3 }], total: 694.50, formaPagamento: 'Cartão', status: 'concluida' },
        { id: 6, data: '2026-05-08', cliente: 'Supermercado Bom Preço', itens: [{ produtoId: 1, quantidade: 20 }, { produtoId: 2, quantidade: 10 }, { produtoId: 8, quantidade: 30 }], total: 1228.00, formaPagamento: 'Boleto', status: 'pendente' },
        { id: 7, data: '2026-05-10', cliente: 'Restaurante Sabor Campestre', itens: [{ produtoId: 5, quantidade: 12 }, { produtoId: 1, quantidade: 8 }], total: 527.20, formaPagamento: 'Pix', status: 'concluida' },
        { id: 8, data: '2026-05-11', cliente: 'Padaria Pão & Queijo', itens: [{ produtoId: 8, quantidade: 80 }, { produtoId: 2, quantidade: 12 }], total: 1342.00, formaPagamento: 'Cartão', status: 'concluida' },
        { id: 9, data: '2026-05-12', cliente: 'Mercado da Cidade', itens: [{ produtoId: 1, quantidade: 15 }, { produtoId: 7, quantidade: 5 }, { produtoId: 3, quantidade: 2 }], total: 1021.50, formaPagamento: 'Pix', status: 'pendente' },
    ];

    const fornecedores = [
        { id: 1, nome: 'Laticínios Vale Verde', contato: 'João', telefone: '(11) 99999-0001', email: 'joao@valeverde.com' },
        { id: 2, nome: 'Comercial Salinas', contato: 'Maria', telefone: '(11) 99999-0002', email: 'maria@salinas.com' },
        { id: 3, nome: 'BioQuímica Ltda', contato: 'Carlos', telefone: '(11) 99999-0003', email: 'carlos@bioquimica.com' },
        { id: 4, nome: 'Embalar+', contato: 'Ana', telefone: '(11) 99999-0004', email: 'ana@embalar.com' },
        { id: 5, nome: 'Química Brasil', contato: 'Pedro', telefone: '(11) 99999-0005', email: 'pedro@quimicabrasil.com' },
    ];

    // ---------- Helpers ----------
    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatarData(dataStr) {
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function calcularMargem(precoVenda, custoProducao) {
        return ((precoVenda - custoProducao) / precoVenda) * 100;
    }

    function getProdutoById(id) {
        return produtos.find(p => p.id === id);
    }

    function getMaterialById(id) {
        return materiais.find(m => m.id === id);
    }

    function getVendasDoMes(mes, ano) {
        return vendas.filter(v => {
            const [vAno, vMes] = v.data.split('-');
            return parseInt(vMes) === mes && parseInt(vAno) === ano;
        });
    }

    function getResumoFinanceiro() {
        const vendasMes = getVendasDoMes(5, 2026);
        const receitaTotal = vendasMes.reduce((acc, v) => acc + v.total, 0);
        const receitaConcluida = vendasMes.filter(v => v.status === 'concluida')
            .reduce((acc, v) => acc + v.total, 0);
        const receitaPendente = vendasMes.filter(v => v.status === 'pendente')
            .reduce((acc, v) => acc + v.total, 0);

        const custoInventarioProdutos = produtos
            .filter(p => p.status === 'ativo')
            .reduce((acc, p) => acc + (p.quantidade * p.custoProducao), 0);

        const custoInventarioMateriais = materiais
            .filter(m => m.status === 'ativo')
            .reduce((acc, m) => acc + (m.quantidade * m.custoUnidade), 0);

        return {
            receitaTotal,
            receitaConcluida,
            receitaPendente,
            custoInventario: custoInventarioProdutos + custoInventarioMateriais,
            numeroVendas: vendasMes.length,
            vendasConcluidas: vendasMes.filter(v => v.status === 'concluida').length,
            vendasPendentes: vendasMes.filter(v => v.status === 'pendente').length,
            totalProdutos: produtos.filter(p => p.status === 'ativo').length,
            totalMateriais: materiais.filter(m => m.status === 'ativo').length,
        };
    }

    function getVendasPorDia() {
        const vendasMes = getVendasDoMes(5, 2026);
        const dias = {};
        vendasMes.forEach(v => {
            const dia = parseInt(v.data.split('-')[2]);
            if (!dias[dia]) dias[dia] = 0;
            dias[dia] += v.total;
        });
        return dias;
    }

    function getProdutosMaisVendidos() {
        const contagem = {};
        vendas.forEach(v => {
            v.itens.forEach(item => {
                if (!contagem[item.produtoId]) contagem[item.produtoId] = 0;
                contagem[item.produtoId] += item.quantidade;
            });
        });
        return Object.entries(contagem)
            .map(([produtoId, quantidade]) => ({
                produto: getProdutoById(parseInt(produtoId)),
                quantidade
            }))
            .sort((a, b) => b.quantidade - a.quantidade);
    }

    function getMateriaisBaixoEstoque() {
        return materiais.filter(m =>
            m.status === 'ativo' && m.quantidade <= m.estoqueMinimo
        ).sort((a, b) => (a.quantidade / a.estoqueMinimo) - (b.quantidade / b.estoqueMinimo));
    }

    function getMateriaisPorCategoria() {
        const cat = {};
        materiais.filter(m => m.status === 'ativo').forEach(m => {
            if (!cat[m.categoria]) cat[m.categoria] = 0;
            cat[m.categoria] += m.quantidade * m.custoUnidade;
        });
        return cat;
    }

    // Public API
    return {
        produtos,
        materiais,
        vendas,
        fornecedores,
        formatarMoeda,
        formatarData,
        calcularMargem,
        getProdutoById,
        getMaterialById,
        getVendasDoMes,
        getResumoFinanceiro,
        getVendasPorDia,
        getProdutosMaisVendidos,
        getMateriaisBaixoEstoque,
        getMateriaisPorCategoria,
    };
})();