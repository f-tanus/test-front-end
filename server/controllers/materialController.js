const { DB } = require('../config/database');

exports.listar = (req, res) => {
    try {
        const { status, categoria } = req.query;
        let materiais = DB.findAll('materiais');
        if (status) materiais = materiais.filter(m => m.status === status);
        if (categoria) materiais = materiais.filter(m => m.categoria === categoria);
        materiais.sort((a, b) => a.nome.localeCompare(b.nome));
        res.json(materiais);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar materiais', detalhe: error.message });
    }
};

exports.obterPorId = (req, res) => {
    try {
        const material = DB.findById('materiais', req.params.id);
        if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
        material.valorTotal = material.quantidade * material.custoUnidade;
        material.estoqueCritico = material.quantidade <= material.estoqueMinimo;
        res.json(material);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter material', detalhe: error.message });
    }
};

exports.criar = (req, res) => {
    try {
        const { nome, categoria, quantidade, unidade, estoqueMinimo, custoUnidade, fornecedor, status } = req.body;

        const errors = [];
        if (!nome || nome.trim() === '') errors.push('Nome do material é obrigatório');
        if (custoUnidade === undefined || custoUnidade < 0) errors.push('Custo por unidade deve ser um valor positivo');
        if (errors.length > 0) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
        }

        const material = DB.insertOne('materiais', {
            nome: nome.trim(),
            categoria: categoria || 'Insumo',
            quantidade: quantidade || 0,
            unidade: unidade || 'un',
            estoqueMinimo: estoqueMinimo || 10,
            custoUnidade: parseFloat(custoUnidade),
            fornecedor: fornecedor || '',
            status: status || 'ativo',
        });

        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar material', detalhe: error.message });
    }
};

exports.atualizar = (req, res) => {
    try {
        const existing = DB.findById('materiais', req.params.id);
        if (!existing) return res.status(404).json({ erro: 'Material não encontrado' });

        const allowedFields = ['nome', 'categoria', 'quantidade', 'unidade', 'estoqueMinimo', 'custoUnidade', 'fornecedor', 'status'];
        const update = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                update[field] = req.body[field];
            }
        });

        const material = DB.updateById('materiais', req.params.id, update);
        res.json(material);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar material', detalhe: error.message });
    }
};

exports.remover = (req, res) => {
    try {
        const material = DB.deleteById('materiais', req.params.id);
        if (!material) return res.status(404).json({ erro: 'Material não encontrado' });
        res.json({ mensagem: 'Material removido com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover material', detalhe: error.message });
    }
};

exports.resumo = (req, res) => {
    try {
        const materiais = DB.findAll('materiais');
        const ativos = materiais.filter(m => m.status === 'ativo');
        const total = materiais.length;
        const totalAtivos = ativos.length;
        const valorEstoque = ativos.reduce((acc, m) => acc + (m.quantidade * m.custoUnidade), 0);
        const baixoEstoque = ativos.filter(m => m.quantidade <= m.estoqueMinimo).length;
        const categorias = {};
        ativos.forEach(m => {
            categorias[m.categoria] = (categorias[m.categoria] || 0) + 1;
        });

        res.json({ total, totalAtivos, valorEstoque, baixoEstoque, categorias });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo', detalhe: error.message });
    }
};

exports.baixoEstoque = (req, res) => {
    try {
        const materiais = DB.findAll('materiais')
            .filter(m => m.status === 'ativo' && m.quantidade <= m.estoqueMinimo)
            .sort((a, b) => a.quantidade - b.quantidade);
        res.json(materiais);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar materiais com estoque baixo', detalhe: error.message });
    }
};