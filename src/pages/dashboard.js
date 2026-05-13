/* =======================================
   QUEIJARIA CORP - Dashboard Page
   ======================================= */

const DashboardPage = {
    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        var data = DataStore.getResumoFinanceiro();
        var vendasPorDia = DataStore.getVendasPorDia();
        var topProdutos = DataStore.getProdutosMaisVendidos().slice(0, 5);
        var baixoEstoque = DataStore.getMateriaisBaixoEstoque();

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
                    produto: '<span class="product-cell"><span class="product-emoji">🧀</span> ' + p.produto.nome + '</span>',
                    quantidade: '<strong>' + p.quantidade + '</strong> ' + p.produto.unidade,
                    receita: DataStore.formatarMoeda(p.quantidade * p.produto.precoVenda)
                };
            })
        );
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
        var recentSales = DataStore.vendas.slice(-4).reverse();
        var saleHeaders = [
            { key: 'data', label: 'Data', align: 'center' },
            { key: 'cliente', label: 'Cliente' },
            { key: 'total', label: 'Total', align: 'right' },
            { key: 'pagamento', label: 'Pagamento' },
            { key: 'status', label: 'Status', align: 'center' }
        ];
        var saleRows = recentSales.map(function(v) {
            return {
                data: DataStore.formatarData(v.data),
                cliente: v.cliente,
                total: DataStore.formatarMoeda(v.total),
                pagamento: v.formaPagamento,
                status: UI.statusBadge(v.status)
            };
        });
        var saleTable = UI.dataTable(saleHeaders, saleRows);
        var saleCard = UI.card('Últimas Vendas', saleTable);
        bottomRow.appendChild(saleCard);

        wrapper.appendChild(bottomRow);

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
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(v) { return 'R$ ' + v.toLocaleString('pt-BR'); }
                            },
                            grid: { color: '#f1f5f9' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }, 50);
    }
};