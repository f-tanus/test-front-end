/* =======================================
   QUEIJARIA CORP - Vendas Page
   ======================================= */

const VendasPage = {
    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        var vendas = DataStore.vendas;

        // ---- KPI Row ----
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';

        var receitaTotal = vendas.reduce(function(acc, v) { return acc + v.total; }, 0);
        var concluidas = vendas.filter(function(v) { return v.status === 'concluida'; });
        var pendentes = vendas.filter(function(v) { return v.status === 'pendente'; });
        var receitaConcluida = concluidas.reduce(function(acc, v) { return acc + v.total; }, 0);
        var ticketMedio = concluidas.length > 0 ? receitaConcluida / concluidas.length : 0;

        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-dollar-sign"></i>',
            label: 'Receita Total',
            value: DataStore.formatarMoeda(receitaTotal),
            color: '#059669',
            bg: '#d1fae5'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-check-circle"></i>',
            label: 'Vendas Concluídas',
            value: concluidas.length,
            color: '#6366f1',
            bg: '#eef2ff'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-clock"></i>',
            label: 'Vendas Pendentes',
            value: pendentes.length,
            color: '#d97706',
            bg: '#fef3c7'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-receipt"></i>',
            label: 'Ticket Médio',
            value: DataStore.formatarMoeda(ticketMedio),
            color: '#0891b2',
            bg: '#cffafe'
        }));

        wrapper.appendChild(kpiRow);

        // ---- Sales Table ----
        var headers = [
            { key: 'id', label: '#', align: 'center', width: '50px' },
            { key: 'data', label: 'Data', align: 'center', width: '90px' },
            { key: 'cliente', label: 'Cliente' },
            { key: 'itens', label: 'Itens', align: 'center' },
            { key: 'total', label: 'Total', align: 'right' },
            { key: 'pagamento', label: 'Pagamento' },
            { key: 'status', label: 'Status', align: 'center' },
            { key: 'acoes', label: 'Ações', align: 'center', width: '80px' }
        ];

        var rows = vendas.slice().reverse().map(function(v) {
            var itensDesc = v.itens.map(function(item) {
                var prod = DataStore.getProdutoById(item.produtoId);
                return prod ? item.quantidade + 'x ' + prod.nome : item.quantidade + 'x ?';
            }).join(', ');

            return {
                id: '<strong>#' + v.id + '</strong>',
                data: DataStore.formatarData(v.data),
                cliente: v.cliente,
                itens: '<span title="' + itensDesc + '">' + v.itens.length + ' itens</span>',
                total: DataStore.formatarMoeda(v.total),
                pagamento: UI.paymentBadge(v.formaPagamento),
                status: UI.statusBadge(v.status),
                acoes: '<button class="btn-icon" title="Ver Detalhes"><i class="fas fa-eye"></i></button> <button class="btn-icon" title="Mais"><i class="fas fa-ellipsis-v"></i></button>'
            };
        });

        var table = UI.dataTable(headers, rows);
        var card = UI.card('Histórico de Vendas', table, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Nova Venda', cls: 'btn-primary', id: 'btn-nova-venda' }
        });
        wrapper.appendChild(card);

        // ---- Summary by Client ----
        var clientes = {};
        concluidas.forEach(function(v) {
            if (!clientes[v.cliente]) clientes[v.cliente] = { compras: 0, total: 0 };
            clientes[v.cliente].compras++;
            clientes[v.cliente].total += v.total;
        });

        var clientHeaders = [
            { key: 'cliente', label: 'Cliente' },
            { key: 'compras', label: 'Compras', align: 'center' },
            { key: 'total', label: 'Total Gasto', align: 'right' },
            { key: 'media', label: 'Média/Compra', align: 'right' }
        ];

        var clientRows = Object.keys(clientes).map(function(c) {
            var cl = clientes[c];
            return {
                cliente: '<strong>' + c + '</strong>',
                compras: cl.compras,
                total: DataStore.formatarMoeda(cl.total),
                media: DataStore.formatarMoeda(cl.total / cl.compras)
            };
        }).sort(function(a, b) {
            return b.compras - a.compras;
        });

        var clientTable = UI.dataTable(clientHeaders, clientRows);
        var clientCard = UI.card('Resumo por Cliente', clientTable);
        wrapper.appendChild(clientCard);
    }
};