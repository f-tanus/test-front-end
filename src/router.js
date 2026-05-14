/* =======================================
   QUEIJARIA CORP - SPA Router
   With auto-refresh and page lifecycle
   ======================================= */

const Router = {
    currentRoute: null,
    currentPage: null,

    init: function() {
        var self = this;
        // Handle hash changes
        window.addEventListener('hashchange', function() { self.navigate(window.location.hash); });
        // Handle click on nav items
        document.querySelectorAll('[data-route]').forEach(function(el) {
            el.addEventListener('click', function(e) {
                var route = el.getAttribute('data-route');
                if (route) {
                    self.goTo(route);
                }
            });
        });
        // Sidebar toggle
        var toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                var sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('collapsed');
                var icon = toggleBtn.querySelector('i');
                icon.className = sidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            });
        }
        // Mobile menu toggle
        var mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.addEventListener('click', function() {
                document.getElementById('sidebar').classList.toggle('mobile-open');
                document.getElementById('sidebar-overlay').classList.toggle('active');
            });
        }
        // Sidebar overlay click
        var overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                document.getElementById('sidebar').classList.remove('mobile-open');
                overlay.classList.remove('active');
            });
        }
        // Refresh button
        var refreshBtn = document.getElementById('btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                self.refresh();
            });
        }
        // Initial navigation
        var hash = window.location.hash || '#/';
        this.navigate(hash);
    },

    goTo: function(route) {
        window.location.hash = '#/' + route;
    },

    /**
     * Refresh the current page (re-fetches data from API)
     */
    refresh: function() {
        var route = this.currentRoute || 'dashboard';
        this.navigate('#/' + route);
    },

    /**
     * Destroy current page lifecycle
     */
    destroyPage: function() {
        if (this.currentPage && typeof this.currentPage.destroy === 'function') {
            this.currentPage.destroy();
        }
        // Destroy any Chart.js instances
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Object.values(Chart.instances).forEach(function(c) {
                try { c.destroy(); } catch (e) {}
            });
        }
    },

    navigate: function(hash) {
        var route = hash.replace('#/', '').replace('#', '') || 'dashboard';
        route = route.split('/')[0];

        // Destroy previous page lifecycle
        this.destroyPage();

        // Update active nav class
        document.querySelectorAll('[data-route]').forEach(function(el) {
            el.classList.toggle('active', el.getAttribute('data-route') === route);
        });

        // Update page title
        var titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Visão geral do negócio' },
            produtos: { title: 'Produtos', subtitle: 'Catálogo e controle de queijos' },
            materiais: { title: 'Materiais', subtitle: 'Estoque de insumos e embalagens' },
            vendas: { title: 'Vendas', subtitle: 'Histórico e faturamento' },
            relatorios: { title: 'Relatórios', subtitle: 'Exportação de dados e análises' }
        };
        var info = titles[route] || { title: 'Página', subtitle: '' };
        document.getElementById('page-title').textContent = info.title;
        document.getElementById('page-subtitle').textContent = info.subtitle;

        // Clear and render page
        var wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = '';

        // Loading state
        wrapper.innerHTML = '<div class="page-loading"><i class="fas fa-circle-notch fa-spin"></i> Carregando...</div>';

        var self = this;
        setTimeout(function() {
            wrapper.innerHTML = '';
            self.currentRoute = route;

            switch (route) {
                case 'dashboard':
                    self.currentPage = DashboardPage;
                    DashboardPage.render();
                    break;
                case 'produtos':
                    self.currentPage = ProdutosPage;
                    ProdutosPage.render();
                    break;
                case 'materiais':
                    self.currentPage = MateriaisPage;
                    MateriaisPage.render();
                    break;
                case 'vendas':
                    self.currentPage = VendasPage;
                    VendasPage.render();
                    break;
                case 'relatorios':
                    self.currentPage = null;
                    self.renderRelatorios(wrapper);
                    break;
                default:
                    self.currentPage = DashboardPage;
                    DashboardPage.render();
                    break;
            }
        }, 150);
    },

    renderRelatorios: function(wrapper) {
        var data = DataStore.getResumoFinanceiro();
        var container = document.createElement('div');
        container.className = 'relatorios-container';

        container.innerHTML =
            '<div class="relatorios-hero">' +
            '<i class="fas fa-file-export fa-3x"></i>' +
            '<h2>Relatórios & Exportação</h2>' +
            '<p>Gere relatórios detalhados de vendas, estoque e produção</p>' +
            '</div>' +
            '<div class="relatorios-grid">' +
            '<div class="relatorio-card">' +
            '<i class="fas fa-file-pdf" style="color:#ef4444"></i>' +
            '<h4>Relatório de Vendas</h4>' +
            '<p>Período: Maio 2026</p>' +
            '<span class="relatorio-meta">' + data.vendasConcluidas + ' vendas · ' + DataStore.formatarMoeda(data.receitaConcluida) + '</span>' +
            '<button class="btn btn-sm btn-outline" style="margin-top:12px"><i class="fas fa-download"></i> Exportar PDF</button>' +
            '</div>' +
            '<div class="relatorio-card">' +
            '<i class="fas fa-file-excel" style="color:#059669"></i>' +
            '<h4>Inventário de Produtos</h4>' +
            '<p>Queijos e derivados em estoque</p>' +
            '<span class="relatorio-meta">' + data.totalProdutos + ' produtos ativos</span>' +
            '<button class="btn btn-sm btn-outline" style="margin-top:12px"><i class="fas fa-download"></i> Exportar XLS</button>' +
            '</div>' +
            '<div class="relatorio-card">' +
            '<i class="fas fa-file-csv" style="color:#6366f1"></i>' +
            '<h4>Materiais & Insumos</h4>' +
            '<p>Controle de matéria-prima</p>' +
            '<span class="relatorio-meta">' + data.totalMateriais + ' materiais ativos</span>' +
            '<button class="btn btn-sm btn-outline" style="margin-top:12px"><i class="fas fa-download"></i> Exportar CSV</button>' +
            '</div>' +
            '<div class="relatorio-card">' +
            '<i class="fas fa-chart-bar" style="color:#d97706"></i>' +
            '<h4>Dashboard Executivo</h4>' +
            '<p>Resumo financeiro completo</p>' +
            '<span class="relatorio-meta">Margem total disponível</span>' +
            '<button class="btn btn-sm btn-outline" style="margin-top:12px"><i class="fas fa-print"></i> Imprimir</button>' +
            '</div>' +
            '</div>';

        wrapper.appendChild(container);
    }
};