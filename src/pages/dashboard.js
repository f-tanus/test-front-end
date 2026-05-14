/* =======================================
   QUEIJARIA CORP - Dashboard Page
   Data from API / DataStore
   ======================================= */

const DashboardPage = {
    refreshInterval: null,

    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = '<div class="page-loading"><i class="fas fa-circle-notch fa-spin"></i> Carregando dashboard...</div>';
        this.loadData(wrapper);
        this.startAutoRefresh(wrapper);
    },

    destroy: function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    startAutoRefresh: function(wrapper) {
        this.destroy();
        var self = this;
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(function() {
            self.loadData(wrapper);
        }, 30000);
    },

    loadData: function(wrapper) {
        var self = this;

        // Try to get data from API
        var promises = [];
        var vendasPorDia = {};
        var topProdutos = [];
        var baixoEstoque = [];
        var resumoFinanceiro = { receitaTotal: 0, numeroVendas: 0, totalProdutos: 0, totalMateriais: 0, custoInventario: 0 };

        var p1 = API.vendas.resumo(5, 2026).then(function(r) {
            vendasPorDia = r.vendasPorDia || {};
            topProdutos = r.produtosMaisVendidos || [];
            resumoFinanceiro.receitaTotal = r.receitaTotal || 0;
            resumoFinanceiro.numeroVendas = r.numeroVendas || 0;
        }).catch(function() {
            var data = DataStore.getResumoFinanceiro();
            vendasPorDia = DataStore.getVendasPorDia();
            topProdutos = DataStore.getProdutosMaisVendidos().slice(0, 5);
            resumoFinanceiro = data;
        });

        var p2 = API.produtos.resumo().then(function(r) {
            resumoFinanceiro.totalProdutos = r.totalAtivos || 0;
        }).catch(function() { resumoFinanceiro.totalProdutos = DataStore.getResumoFinanceiro().totalProdutos; });

        var p3 = API.materiais.resumo().then(function(r) {
            resumoFinanceiro.totalMateriais = r.totalAtivos || 0;
            resumoFinanceiro.custoInventario = r.valorEstoque || 0;
        }).catch(function() {
            var data = DataStore.getResumoFinanceiro();
            resumoFinanceiro.totalMateriais = data.totalMateriais;
            resumoFinanceiro.custoInventario = data.custoInventario;
        });

        var p4 = API.materiais.baixoEstoque().then(function(r) {
            baixoEstoque = r || [];
        }).catch(function() { baixoEstoque = DataStore.getMateriaisBaixoEstoque(); });

        Promise.all([p1, p2, p3, p4]).then(function() {
            var currentLoading = wrapper.querySelector('.page-loading');
            if (currentLoading) wrapper.innerHTML = '';
            self.renderContent(wrapper, resumoFinanceiro, vendasPorDia, topProdutos, baixoEstoque);
        });
    },

    renderContent: function(wrapper, data, vendasPorDia, topProdutos, baixoEstoque) {
        // Clear any previous charts
        var oldChart = Chart.instances ? Object.values(Chart.instances) : [];
        oldChart.forEach(function(c) { c.destroy(); });

        wrapper.innerHTML = '';

        // ---- KPI Cards Row ----
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';

        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-dollar-sign"></i>',
            label: 'Receita do Mês',
            value: DataStore.formatarMoeda(data.receitaTotal),
            trend: 'up',
            trendValue: '<i class="fas fa-arrow-up"></i> +12%',
            color: '#059669',
            bg: '#d1fae5'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-shopping-cart"></i>',
            label: 'Vendas Realizadas',
            value: data.numeroVendas,
            trend: 'up',
            trendValue: '<i class="fas fa-arrow-up"></i> +2',
            color: '#6366f1',
            bg: '#eef2ff'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-cheese"></i>',
            label: 'Produtos Ativos',
            value: data.totalProdutos,
            trendValue: '',
            color: '#d97706',
            bg: '#fef3c7'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-boxes"></i>',
            label: 'Materiais em Estoque',
            value: data.totalMateriais,
            trendValue: data.custoInventario > 0 ? 'R$ ' + data.custoInventario.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
            color: '#0891b2',
            bg: '#cffafe'
        }));

        wrapper.appendChild(kpiRow);

        // ---- Charts Row ----
        var chartsRow = document.createElement('div');
        chartsRow.className = 'charts-row';

        // Revenue chart card
        var revenueCard = UI.card('Receita Diária - Maio 2026', '<canvas id="revenueChart"></canvas>', { className: 'chart-card' });
        chartsRow.appendChild(revenueCard);

        // Top products card
        var topTable = UI.dataTable(
            [{ key: 'produto', label: 'Produto' }, { key: 'quantidade', label: 'Qtd Vendida', align: 'center' }, { key: 'receita', label: 'Receita', align: 'right' }],
            topProdutos.map(function(p) {
                return {
                    produto: '<span class="product-cell"><span class="product-emoji">🧀</span> ' + p.nome + '</span>',
                    quantidade: '<strong>' + p.quantidade + '</strong>',
                    receita: DataStore.formatarMoeda(topProdutos.length > 0 ? p.quantidade * 32.9 : 0)
                };
            })
        );
        if (topProdutos.length === 0) {
            topTable = UI.dataTable(
                [{ key: 'produto', label: 'Produto' }, { key: 'quantidade', label: 'Qtd Vendida', align: 'center' }, { key: 'receita', label: 'Receita', align: 'right' }], []
            );
        }
        var topCard = UI.card('Produtos Mais Vendidos', topTable);
        chartsRow.appendChild(topCard);

        wrapper.appendChild(chartsRow);

        // ---- Bottom Row: Low Stock Alerts + Recent Sales ----
        var bottomRow = document.createElement('div');
        bottomRow.className = 'charts-row';

        // Low stock
        var lowHeaders = [
            { key: 'nome', label: 'Material' },
            { key: 'estoque', label: 'Estoque', align: 'center' },
            { key: 'minimo', label: 'Mínimo', align: 'center' },
            { key: 'status', label: 'Status', align: 'center' }
        ];
        var lowRows = baixoEstoque.map(function(m) {
            var ratio = Math.round((m.quantidade / m.estoqueMinimo) * 100);
            var barColor = ratio < 50 ? '#ef4444' : '#f59e0b';
            return {
                nome: m.nome,
                estoque: '<span class="stock-bar-container"><span class="stock-bar" style="width:' + ratio + '%;background:' + barColor + '"></span>' + m.quantidade + ' ' + m.unidade + '</span>',
                minimo: m.estoqueMinimo + ' ' + m.unidade,
                status: '<span class="badge badge-danger">Crítico</span>'
            };
        });
        if (lowRows.length === 0) {
            lowRows = [{ nome: '<span style="color:#059669"><i class="fas fa-check-circle"></i> Todos os materiais estão com estoque adequado</span>', estoque: '-', minimo: '-', status: '<span class="badge badge-success">OK</span>' }];
        }
        var lowTable = UI.dataTable(lowHeaders, lowRows);
        var lowCard = UI.card('Materiais com Estoque Baixo', lowTable, { icon: '<i class="fas fa-exclamation-triangle" style="color:#ef4444"></i>' });
        bottomRow.appendChild(lowCard);

        // Recent sales
        API.vendas.listar().then(function(vendas) {
            var recentSales = vendas.slice(0, 4);
            var saleHeaders = [
                { key: 'data', label: 'Data', align: 'center' },
                { key: 'cliente', label: 'Cliente' },
                { key: 'total', label: 'Total', align: 'right' },
                { key: 'pagamento', label: 'Pagamento' },
                { key: 'status', label: 'Status', align: 'center' }
            ];
            var saleRows = recentSales.map(function(v) {
                return {
                    data: v.dataVenda ? DataStore.formatarData(v.dataVenda.split('T')[0]) : '-',
                    cliente: v.cliente,
                    total: DataStore.formatarMoeda(v.total),
                    pagamento: v.formaPagamento,
                    status: UI.statusBadge(v.status)
                };
            });
            var saleTable = UI.dataTable(saleHeaders, saleRows);
            var saleCard = UI.card('Últimas Vendas', saleTable);
            bottomRow.appendChild(saleCard);

            // ---- Render Chart after DOM ----
            setTimeout(function() {
                var ctx = document.getElementById('revenueChart');
                if (!ctx) return;
                var labels = [];
                var values = [];
                for (var d = 1; d <= 12; d++) {
                    labels.push(d + '/05');
                    values.push(vendasPorDia[d] || 0);
                }
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Receita (R$)',
                            data: values,
                            backgroundColor: '#6366f1',
                            borderRadius: 6,
                            barThickness: 20
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: function(v) { return 'R$ ' + v.toLocaleString('pt-BR'); } },
                                grid: { color: '#f1f5f9' }
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }, 50);
        }).catch(function() {
            bottomRow.appendChild(UI.card('Últimas Vendas', '<div class="empty-state">Erro ao carregar vendas</div>'));
        });
    }
};