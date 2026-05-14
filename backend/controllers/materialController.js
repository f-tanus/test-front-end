const Material = require('../models/Material');

exports.listar = async(req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;
        const materiais = await Material.find(filter).sort({ nome: 1 });
        res.json(materiais);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar materiais', detalhe: error.message });
    }
};

exports.obterPorId = async(req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
        res.json(material);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter material', detalhe: error.message });
    }
};

exports.criar = async(req, res) => {
    try {
        const material = new Material(req.body);
        const saved = await material.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }
        res.status(500).json({ erro: 'Erro ao criar material', detalhe: error.message });
    }
};

exports.atualizar = async(req, res) => {
    try {
        const material = await Material.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
        res.json(material);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }
        res.status(500).json({ erro: 'Erro ao atualizar material', detalhe: error.message });
    }
};

exports.remover = async(req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);
        if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
        res.json({ mensagem: 'Material removido com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover material', detalhe: error.message });
    }
};

exports.resumo = async(req, res) => {
    try {
        const total = await Material.countDocuments();
        const totalAtivos = await Material.countDocuments({ status: 'ativo' });
        const materiais = await Material.find({ status: 'ativo' });
        const valorEstoque = materiais.reduce((acc, m) => acc + (m.quantidade * m.custoUnidade), 0);
        res.json({ total, totalAtivos, valorEstoque });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo', detalhe: error.message });
    }
};

exports.baixoEstoque = async(req, res) => {
    try {
        const materiais = await Material.find({
            status: 'ativo',
            $expr: { $lte: ['$quantidade', '$estoqueMinimo'] }
        }).sort({ quantidade: 1 });
        res.json(materiais);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter materiais com baixo estoque', detalhe: error.message });
    }
};