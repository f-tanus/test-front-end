const { DB } = require('../config/database');

exports.listar = (req, res) => {
    try {
        const { status, inicio, fim } = req.query;
        let vendas = DB.findAll('vendas');

        if (status) {
            vendas = vendas.filter(v => v.status === status);
        }

        if (inicio || fim) {
            vendas = vendas.filter(v => {
                const dataVenda = new Date(v.dataVenda).getTime();
                if (inicio && dataVenda < new Date(inicio).getTime()) return false;
                if (fim && dataVenda > new Date(fim).getTime()) return false;
                return true;
            });
        }

        // Populate produtos
        vendas = vendas.map(v => {
            v.itens = v.itens.map(item => {
                const produto = DB.findById('produtos', item.produtoId);
                item.produto = produto ? { _id: produto._id, nome: produto.nome, unidade: produto.unidade } : { _id: item.produtoId, nome: 'Produto removido', unidade: '' };
                item.produtoId = item.produto;
                delete item.produto;
                return item;
            });
            return v;
        });

        vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda));
        res.json(vendas);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao listar vendas', detalhe: error.message });
    }
};

exports.obterPorId = (req, res) => {
    try {
        const venda = DB.findById('vendas', req.params.id);
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

        venda.itens = venda.itens.map(item => {
            const produto = DB.findById('produtos', item.produtoId);
            item.produto = produto || { _id: item.produtoId, nome: 'Produto removido', unidade: '' };
            return item;
        });

        res.json(venda);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter venda', detalhe: error.message });
    }
};

exports.criar = (req, res) => {
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
            const produto = DB.findById('produtos', item.produtoId);
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

        const venda = DB.insertOne('vendas', {
            cliente: cliente.trim(),
            itens: validatedItens,
            total: total,
            formaPagamento: formaPagamento || 'Pix',
            status: novoStatus,
            dataVenda: new Date().toISOString()
        });

        // Only deduct stock if status is 'concluida'
        if (novoStatus === 'concluida') {
            for (const item of validatedItens) {
                const produto = DB.findById('produtos', item.produtoId);
                DB.updateById('produtos', item.produtoId, {
                    quantidade: (produto.quantidade || 0) - item.quantidade
                });
            }
        }

        res.status(201).json(venda);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar venda', detalhe: error.message });
    }
};

exports.atualizarStatus = (req, res) => {
    try {
        const { status } = req.body;
        const validStatus = ['concluida', 'pendente', 'cancelada'];

        if (!validStatus.includes(status)) {
            return res.status(400).json({ erro: 'Status inválido. Use: concluida, pendente ou cancelada' });
        }

        const venda = DB.findById('vendas', req.params.id);
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

        const statusAnterior = venda.status;

        // If already in the target status, do nothing
        if (statusAnterior === status) {
            return res.json(venda);
        }

        // Handle stock adjustments when status changes
        // pendente → concluida: deduct stock
        if (statusAnterior === 'pendente' && status === 'concluida') {
            for (const item of venda.itens) {
                const produto = DB.findById('produtos', item.produtoId);
                if (produto) {
                    DB.updateById('produtos', item.produtoId, {
                        quantidade: (produto.quantidade || 0) - item.quantidade
                    });
                }
            }
        }

        // concluida → pendente or concluida → cancelada: restore stock
        if (statusAnterior === 'concluida' && (status === 'pendente' || status === 'cancelada')) {
            for (const item of venda.itens) {
                const produto = DB.findById('produtos', item.produtoId);
                if (produto) {
                    DB.updateById('produtos', item.produtoId, {
                        quantidade: (produto.quantidade || 0) + item.quantidade
                    });
                }
            }
        }

        // pendente → cancelada: no stock change (was never deducted)
        // cancelada → concluida: deduct stock
        if (statusAnterior === 'cancelada' && status === 'concluida') {
            for (const item of venda.itens) {
                const produto = DB.findById('produtos', item.produtoId);
                if (produto) {
                    if ((produto.quantidade || 0) < item.quantidade) {
                        return res.status(400).json({
                            erro: 'Estoque insuficiente para concluir. "' + produto.nome + '" precisa de ' + item.quantidade + ', disponível: ' + produto.quantidade
                        });
                    }
                    DB.updateById('produtos', item.produtoId, {
                        quantidade: (produto.quantidade || 0) - item.quantidade
                    });
                }
            }
        }

        const updated = DB.updateById('vendas', req.params.id, { status });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar status', detalhe: error.message });
    }
};

exports.remover = (req, res) => {
    try {
        const venda = DB.findById('vendas', req.params.id);
        if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });

        // Only restore stock if the sale was concluded (stock was deducted)
        if (venda.status === 'concluida') {
            for (const item of venda.itens) {
                const produto = DB.findById('produtos', item.produtoId);
                if (produto) {
                    DB.updateById('produtos', item.produtoId, {
                        quantidade: (produto.quantidade || 0) + item.quantidade
                    });
                }
            }
        }

        DB.deleteById('vendas', req.params.id);
        res.json({ mensagem: 'Venda removida com sucesso. Estoque restaurado se aplicável.' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover venda', detalhe: error.message });
    }
};

exports.resumo = (req, res) => {
    try {
        const { mes, ano } = req.query;
        const now = new Date();
        const targetMes = parseInt(mes) || (now.getMonth() + 1);
        const targetAno = parseInt(ano) || now.getFullYear();

        const vendas = DB.findAll('vendas').filter(v => {
            const data = new Date(v.dataVenda);
            return data.getMonth() + 1 === targetMes && data.getFullYear() === targetAno;
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
            const dia = new Date(v.dataVenda).getDate();
            vendasPorDia[dia] = (vendasPorDia[dia] || 0) + (v.total || 0);
        });

        const produtoContagem = {};
        vendas.forEach(v => {
            if (!v.itens) return;
            v.itens.forEach(item => {
                const prodId = item.produtoId;
                if (!prodId) return;
                if (!produtoContagem[prodId]) {
                    const produto = DB.findById('produtos', prodId);
                    produtoContagem[prodId] = {
                        nome: produto ? produto.nome : 'Desconhecido',
                        quantidade: 0
                    };
                }
                produtoContagem[prodId].quantidade += item.quantidade || 0;
            });
        });

        const produtosMaisVendidos = Object.entries(produtoContagem)
            .map(([id, data]) => ({ id, nome: data.nome, quantidade: data.quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);

        res.json({
            receitaTotal,
            receitaConcluida,
            receitaPendente,
            numeroVendas: vendas.length,
            vendasConcluidas,
            vendasPendentes,
            vendasPorDia,
            produtosMaisVendidos,
            ticketMedio: vendasConcluidas > 0 ? receitaConcluida / vendasConcluidas : 0
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao obter resumo de vendas', detalhe: error.message });
    }
};