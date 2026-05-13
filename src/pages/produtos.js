/* =======================================
   QUEIJARIA CORP - Produtos Page
   ======================================= */

const ProdutosPage = {
    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        var produtos = DataStore.produtos;

        // ---- KPI Row ----
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';

        var ativos = produtos.filter(function(p) { return p.status === 'ativo'; });
        var valorEstoque = ativos.reduce(function(acc, p) { return acc + (p.quantidade * p.precoVenda); }, 0);
        var margemMedia = ativos.reduce(function(acc, p) { return acc + DataStore.calcularMargem(p.precoVenda, p.custoProducao); }, 0) / (ativos.length || 1);

        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-cheese"></i>',
            label: 'Total de Produtos',
            value: produtos.length,
            color: '#6366f1',
            bg: '#eef2ff'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-box"></i>',
            label: 'Produtos Ativos',
            value: ativos.length,
            color: '#059669',
            bg: '#d1fae5'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-dollar-sign"></i>',
            label: 'Valor em Estoque',
            value: DataStore.formatarMoeda(valorEstoque),
            color: '#d97706',
            bg: '#fef3c7'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-chart-line"></i>',
            label: 'Margem Média',
            value: margemMedia.toFixed(1) + '%',
            color: '#0891b2',
            bg: '#cffafe'
        }));

        wrapper.appendChild(kpiRow);

        // ---- Products Table ----
        var headers = [
            { key: 'nome', label: 'Produto' },
            { key: 'tipo', label: 'Tipo', align: 'center' },
            { key: 'estoque', label: 'Estoque', align: 'center' },
            { key: 'preco', label: 'Preço Venda', align: 'right' },
            { key: 'custo', label: 'Custo Prod.', align: 'right' },
            { key: 'margem', label: 'Margem', align: 'center' },
            { key: 'status', label: 'Status', align: 'center' },
            { key: 'acoes', label: 'Ações', align: 'center' }
        ];

        var rows = produtos.map(function(p) {
            var margem = DataStore.calcularMargem(p.precoVenda, p.custoProducao);
            var margemColor = margem > 40 ? '#059669' : margem > 25 ? '#d97706' : '#ef4444';
            return {
                nome: '<span class="product-cell"><span class="product-emoji">🧀</span> <strong>' + p.nome + '</strong></span>',
                tipo: '<span class="tipo-badge">' + p.tipo + '</span>',
                estoque: p.quantidade + ' ' + p.unidade,
                preco: DataStore.formatarMoeda(p.precoVenda),
                custo: DataStore.formatarMoeda(p.custoProducao),
                margem: '<span style="color:' + margemColor + ';font-weight:600">' + margem.toFixed(1) + '%</span>',
                status: UI.statusBadge(p.status),
                acoes: '<button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-icon btn-icon-danger" title="Desativar"><i class="fas fa-trash"></i></button>'
            };
        });

        var table = UI.dataTable(headers, rows);
        var card = UI.card('Catálogo de Produtos', table, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Novo Produto', cls: 'btn-primary', id: 'btn-novo-produto' }
        });
        wrapper.appendChild(card);
    }
};