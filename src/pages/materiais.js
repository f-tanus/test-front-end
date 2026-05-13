/* =======================================
   QUEIJARIA CORP - Materiais Page
   ======================================= */

const MateriaisPage = {
    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        var materiais = DataStore.materiais;

        // ---- KPI Row ----
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';

        var ativos = materiais.filter(function(m) { return m.status === 'ativo'; });
        var valorTotal = ativos.reduce(function(acc, m) { return acc + (m.quantidade * m.custoUnidade); }, 0);
        var baixoEstoque = DataStore.getMateriaisBaixoEstoque();
        var categorias = {};
        ativos.forEach(function(m) {
            categorias[m.categoria] = (categorias[m.categoria] || 0) + 1;
        });

        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-boxes"></i>',
            label: 'Total Materiais',
            value: materiais.length,
            color: '#6366f1',
            bg: '#eef2ff'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-check-circle"></i>',
            label: 'Materiais Ativos',
            value: ativos.length,
            color: '#059669',
            bg: '#d1fae5'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-dollar-sign"></i>',
            label: 'Valor em Estoque',
            value: DataStore.formatarMoeda(valorTotal),
            color: '#d97706',
            bg: '#fef3c7'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-exclamation-triangle"></i>',
            label: 'Estoque Baixo',
            value: baixoEstoque.length,
            color: baixoEstoque.length > 0 ? '#ef4444' : '#059669',
            bg: baixoEstoque.length > 0 ? '#fee2e2' : '#d1fae5',
            trend: baixoEstoque.length > 0 ? 'down' : '',
            trendValue: baixoEstoque.length > 0 ? '<i class="fas fa-exclamation"></i> Atenção' : 'Tudo OK'
        }));

        wrapper.appendChild(kpiRow);

        // ---- Tabs: All Materials / By Category ----
        var allTabContent = this.buildAllMaterialsTab(ativos);
        var catTabContent = this.buildCategoryTab(ativos, categorias);

        var tabs = UI.tabs([
            { label: 'Todos os Materiais', content: allTabContent },
            { label: 'Por Categoria', content: catTabContent }
        ]);

        var card = UI.card('Controle de Materiais', tabs, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Novo Material', cls: 'btn-primary', id: 'btn-novo-material' }
        });
        wrapper.appendChild(card);
    },

    buildAllMaterialsTab: function(ativos) {
        var headers = [
            { key: 'nome', label: 'Material' },
            { key: 'categoria', label: 'Categoria', align: 'center' },
            { key: 'estoque', label: 'Estoque', align: 'center' },
            { key: 'custo', label: 'Custo Un.', align: 'right' },
            { key: 'valorTotal', label: 'Valor Total', align: 'right' },
            { key: 'fornecedor', label: 'Fornecedor' },
            { key: 'status', label: 'Status', align: 'center' }
        ];

        var baixoIds = DataStore.getMateriaisBaixoEstoque().map(function(m) { return m.id; });

        var rows = ativos.map(function(m) {
            var isLow = baixoIds.indexOf(m.id) !== -1;
            var estoqueHtml = m.quantidade + ' ' + m.unidade;
            if (isLow) {
                estoqueHtml = '<span style="color:#ef4444;font-weight:600">' + estoqueHtml + ' ⚠️</span>';
            }
            return {
                nome: '<strong>' + m.nome + '</strong>' + (isLow ? ' <span class="badge badge-danger">Mínimo</span>' : ''),
                categoria: '<span class="tipo-badge">' + m.categoria + '</span>',
                estoque: estoqueHtml,
                custo: DataStore.formatarMoeda(m.custoUnidade),
                valorTotal: DataStore.formatarMoeda(m.quantidade * m.custoUnidade),
                fornecedor: m.fornecedor,
                status: UI.statusBadge(m.status)
            };
        });

        return UI.dataTable(headers, rows);
    },

    buildCategoryTab: function(ativos, categorias) {
        var container = document.createElement('div');
        container.className = 'category-grid';

        var catOrder = ['Matéria-Prima', 'Insumo', 'Embalagem', 'Logística'];
        catOrder.forEach(function(cat) {
            if (!categorias[cat]) return;
            var items = ativos.filter(function(m) { return m.categoria === cat; });
            var valorCat = items.reduce(function(acc, m) { return acc + (m.quantidade * m.custoUnidade); }, 0);

            var card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML =
                '<div class="category-card-header">' +
                '<h4>' + cat + '</h4>' +
                '<span class="category-count">' + items.length + ' itens</span>' +
                '</div>' +
                '<div class="category-card-value">' + DataStore.formatarMoeda(valorCat) + '</div>' +
                '<div class="category-card-sub">Valor total em estoque</div>';

            var list = document.createElement('ul');
            list.className = 'category-list';
            items.forEach(function(m) {
                var li = document.createElement('li');
                var isLow = m.quantidade <= m.estoqueMinimo;
                li.innerHTML =
                    '<div class="cat-item-info">' +
                    '<strong>' + m.nome + '</strong>' +
                    '<span>' + m.quantidade + ' ' + m.unidade + '</span>' +
                    '</div>' +
                    '<span class="cat-item-value">' + DataStore.formatarMoeda(m.quantidade * m.custoUnidade) + '</span>' +
                    (isLow ? '<span class="badge badge-danger" style="margin-left:8px">!</span>' : '');
                list.appendChild(li);
            });
            card.appendChild(list);
            container.appendChild(card);
        });

        return container;
    }
};