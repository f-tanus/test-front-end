const Produto = require('../models/Produto');

exports.listar = async(req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const produtos = await Produto.find(filter).sort({ nome: 1 });
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar produtos', detalhe: error.message });
    }
};

exports.obterPorId = async(req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(produto);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter produto', detalhe: error.message });
    }
};

exports.criar = async(req, res) => {
    try {
        const produto = new Produto(req.body);
        const saved = await produto.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }
        res.status(500).json({ erro: 'Erro ao criar produto', detalhe: error.message });
    }
};

exports.atualizar = async(req, res) => {
    try {
        const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(produto);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }
        res.status(500).json({ erro: 'Erro ao atualizar produto', detalhe: error.message });
    }
};

exports.remover = async(req, res) => {
    try {
        const produto = await Produto.findByIdAndDelete(req.params.id);
        if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json({ mensagem: 'Produto removido com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover produto', detalhe: error.message });
    }
};

exports.resumo = async(req, res) => {
    try {
        const total = await Produto.countDocuments();
        const totalAtivos = await Produto.countDocuments({ status: 'ativo' });
        const produtos = await Produto.find({ status: 'ativo' });
        const valorEstoque = produtos.reduce((acc, p) => acc + (p.quantidade * p.precoVenda), 0);
        const margemMedia = produtos.length > 0 ?
            produtos.reduce((acc, p) => {
                const m = p.precoVenda > 0 ? ((p.precoVenda - p.custoProducao) / p.precoVenda) * 100 : 0;
                return acc + m;
            }, 0) / produtos.length :
            0;

        res.json({ total, totalAtivos, valorEstoque, margemMedia: margemMedia.toFixed(1) });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo', detalhe: error.message });
    }
};