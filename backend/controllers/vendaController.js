const Venda = require('../models/Venda');
const Produto = require('../models/Produto');

exports.listar = async(req, res) => {
    try {
        const { status, inicio, fim } = req.query;
        const filter = {};

        if (status) filter.status = status;

        if (inicio || fim) {
            filter.dataVenda = {};
            if (inicio) filter.dataVenda.$gte = new Date(inicio);
            if (fim) filter.dataVenda.$lte = new Date(fim);
        }

        const vendas = await Venda.find(filter)
            .populate('itens.produtoId', 'nome unidade')
            .sort({ dataVenda: -1 });

        res.json(vendas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar vendas', detalhe: error.message });
    }
};

exports.obterPorId = async(req, res) => {
    try {
        const venda = await Venda.findById(req.params.id)
            .populate('itens.produtoId', 'nome unidade precoVenda');
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
        res.json(venda);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter venda', detalhe: error.message });
    }
};

exports.criar = async(req, res) => {
    try {
        const { cliente, itens, formaPagamento, status } = req.body;

        if (!cliente || cliente.trim() === '') {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: ['Nome do cliente é obrigatório'] });
        }
        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Dados inválidos', detalhes: ['A venda deve ter pelo menos um item'] });
        }

        let total = 0;
        const validatedItens = [];

        for (const item of itens) {
            const produto = await Produto.findById(item.produtoId);
            if (!produto) {
                return res.status(400).json({ erro: 'Produto com ID ' + item.produtoId + ' não encontrado' });
            }
            if (produto.quantidade < item.quantidade) {
                return res.status(400).json({
                    erro: 'Estoque insuficiente para "' + produto.nome + '". Disponível: ' + produto.quantidade + ' ' + produto.unidade
                });
            }
            const precoUnitario = item.precoUnitario || produto.precoVenda;
            total += item.quantidade * precoUnitario;
            validatedItens.push({
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: precoUnitario
            });
        }

        const novoStatus = status || 'pendente';

        const venda = new Venda({
            cliente: cliente.trim(),
            itens: validatedItens,
            total: total,
            formaPagamento: formaPagamento || 'Pix',
            status: novoStatus,
            dataVenda: new Date()
        });

        const saved = await venda.save();

        // Deduct stock if concluded
        if (novoStatus === 'concluida') {
            for (const item of validatedItens) {
                await Produto.findByIdAndUpdate(item.produtoId, {
                    $inc: { quantidade: -item.quantidade }
                });
            }
        }

        const populated = await Venda.findById(saved._id)
            .populate('itens.produtoId', 'nome unidade');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar venda', detalhe: error.message });
    }
};

exports.atualizarStatus = async(req, res) => {
    try {
        const { status } = req.body;
        const validStatus = ['concluida', 'pendente', 'cancelada'];

        if (!validStatus.includes(status)) {
            return res.status(400).json({ erro: 'Status inválido. Use: concluida, pendente ou cancelada' });
        }

        const venda = await Venda.findById(req.params.id);
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

        const statusAnterior = venda.status;
        if (statusAnterior === status) return res.json(venda);

        // Handle stock adjustments on status change
        // pendente → concluida: deduct stock
        if (statusAnterior === 'pendente' && status === 'concluida') {
            for (const item of venda.itens) {
                await Produto.findByIdAndUpdate(item.produtoId, {
                    $inc: { quantidade: -item.quantidade }
                });
            }
        }

        // concluida → pendente/cancelada: restore stock
        if (statusAnterior === 'concluida' && (status === 'pendente' || status === 'cancelada')) {
            for (const item of venda.itens) {
                await Produto.findByIdAndUpdate(item.produtoId, {
                    $inc: { quantidade: item.quantidade }
                });
            }
        }

        // cancelada → concluida: deduct stock (check availability)
        if (statusAnterior === 'cancelada' && status === 'concluida') {
            for (const item of venda.itens) {
                const produto = await Produto.findById(item.produtoId);
                if (produto) {
                    if ((produto.quantidade || 0) < item.quantidade) {
                        return res.status(400).json({
                            erro: 'Estoque insuficiente para concluir. "' + produto.nome + '" precisa de ' + item.quantidade + ', disponível: ' + produto.quantidade
                        });
                    }
                    await Produto.findByIdAndUpdate(item.produtoId, {
                        $inc: { quantidade: -item.quantidade }
                    });
                }
            }
        }

        venda.status = status;
        const updated = await venda.save();

        res.json(updated);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar status', detalhe: error.message });
    }
};

exports.remover = async(req, res) => {
    try {
        const venda = await Venda.findById(req.params.id);
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

        // Restore stock if sale was concluded
        if (venda.status === 'concluida') {
            for (const item of venda.itens) {
                await Produto.findByIdAndUpdate(item.produtoId, {
                    $inc: { quantidade: item.quantidade }
                });
            }
        }

        await Venda.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Venda removida com sucesso. Estoque restaurado se aplicável.' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover venda', detalhe: error.message });
    }
};

exports.resumo = async(req, res) => {
    try {
        const { mes, ano } = req.query;
        const now = new Date();
        const targetMes = parseInt(mes) || (now.getMonth() + 1);
        const targetAno = parseInt(ano) || now.getFullYear();

        const startDate = new Date(targetAno, targetMes - 1, 1);
        const endDate = new Date(targetAno, targetMes, 1);

        const vendas = await Venda.find({
            dataVenda: { $gte: startDate, $lt: endDate }
        });

        const receitaTotal = vendas.reduce((acc, v) => acc + (v.total || 0), 0);
        const receitaConcluida = vendas.filter(v => v.status === 'concluida')
            .reduce((acc, v) => acc + (v.total || 0), 0);
        const receitaPendente = vendas.filter(v => v.status === 'pendente')
            .reduce((acc, v) => acc + (v.total || 0), 0);
        const vendasConcluidas = vendas.filter(v => v.status === 'concluida').length;
        const vendasPendentes = vendas.filter(v => v.status === 'pendente').length;

        const vendasPorDia = {};
        vendas.forEach(v => {
            const dia = v.dataVenda.getDate();
            vendasPorDia[dia] = (vendasPorDia[dia] || 0) + (v.total || 0);
        });

        // Top produtos mais vendidos via aggregation
        const topProdutosAgg = await Venda.aggregate([
            { $match: { dataVenda: { $gte: startDate, $lt: endDate }, status: 'concluida' } },
            { $unwind: '$itens' },
            { $group: { _id: '$itens.produtoId', quantidade: { $sum: '$itens.quantidade' } } },
            { $sort: { quantidade: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'produtos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'produto'
                }
            },
            { $unwind: { path: '$produto', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    nome: { $ifNull: ['$produto.nome', 'Desconhecido'] },
                    quantidade: 1
                }
            }
        ]);

        const ticketMedio = vendasConcluidas > 0 ? receitaConcluida / vendasConcluidas : 0;

        res.json({
            receitaTotal,
            receitaConcluida,
            receitaPendente,
            numeroVendas: vendas.length,
            vendasConcluidas,
            vendasPendentes,
            vendasPorDia,
            produtosMaisVendidos: topProdutosAgg,
            ticketMedio
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo de vendas', detalhe: error.message });
    }
};