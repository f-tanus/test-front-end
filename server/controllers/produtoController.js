const { DB } = require('../config/database');

exports.listar = (req, res) => {
    try {
        const { status } = req.query;
        let produtos = DB.findAll('produtos');
        if (status) {
            produtos = produtos.filter(p => p.status === status);
        }
        produtos.sort((a, b) => a.nome.localeCompare(b.nome));
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar produtos', detalhe: error.message });
    }
};

exports.obterPorId = (req, res) => {
    try {
        const produto = DB.findById('produtos', req.params.id);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        // Add virtual fields
        produto.margem = produto.precoVenda > 0 ?
            ((produto.precoVenda - produto.custoProducao) / produto.precoVenda) * 100 :
            0;
        produto.valorEstoque = produto.quantidade * produto.precoVenda;
        res.json(produto);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter produto', detalhe: error.message });
    }
};

exports.criar = (req, res) => {
    try {
        const { nome, tipo, quantidade, unidade, precoVenda, custoProducao, status } = req.body;

        // Validation
        const errors = [];
        if (!nome || nome.trim() === '') errors.push('Nome do produto é obrigatório');
        if (!precoVenda || precoVenda < 0) errors.push('Preço de venda deve ser um valor positivo');
        if (!custoProducao || custoProducao < 0) errors.push('Custo de produção deve ser um valor positivo');
        if (errors.length > 0) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }

        const produto = DB.insertOne('produtos', {
            nome: nome.trim(),
            tipo: tipo || 'Frescal',
            quantidade: quantidade || 0,
            unidade: unidade || 'kg',
            precoVenda: parseFloat(precoVenda),
            custoProducao: parseFloat(custoProducao),
            status: status || 'ativo',
        });

        res.status(201).json(produto);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar produto', detalhe: error.message });
    }
};

exports.atualizar = (req, res) => {
    try {
        const existing = DB.findById('produtos', req.params.id);
        if (!existing) return res.status(404).json({ erro: 'Produto não encontrado' });

        const allowedFields = ['nome', 'tipo', 'quantidade', 'unidade', 'precoVenda', 'custoProducao', 'status'];
        const update = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                update[field] = req.body[field];
            }
        });

        const produto = DB.updateById('produtos', req.params.id, update);
        res.json(produto);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar produto', detalhe: error.message });
    }
};

exports.remover = (req, res) => {
    try {
        const produto = DB.deleteById('produtos', req.params.id);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json({ mensagem: 'Produto removido com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover produto', detalhe: error.message });
    }
};

exports.resumo = (req, res) => {
    try {
        const produtos = DB.findAll('produtos');
        const ativos = produtos.filter(p => p.status === 'ativo');
        const total = produtos.length;
        const totalAtivos = ativos.length;
        const valorEstoque = ativos.reduce((acc, p) => acc + (p.quantidade * p.precoVenda), 0);
        const margemMedia = ativos.length > 0 ?
            ativos.reduce((acc, p) => {
                const margem = p.precoVenda > 0 ? ((p.precoVenda - p.custoProducao) / p.precoVenda) * 100 : 0;
                return acc + margem;
            }, 0) / ativos.length :
            0;

        res.json({ total, totalAtivos, valorEstoque, margemMedia: margemMedia.toFixed(1) });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo', detalhe: error.message });
    }
};