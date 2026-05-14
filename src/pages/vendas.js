/* =======================================
   QUEIJARIA CORP - Vendas Page
   Data from API, interactive CRUD buttons
   ======================================= */

const VendasPage = {
    refreshInterval: null,

    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = '<div class="page-loading"><i class="fas fa-circle-notch fa-spin"></i> Carregando vendas...</div>';
        this.loadVendas(wrapper);
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
            self.loadVendas(wrapper);
        }, 30000);
    },

    loadVendas: function(wrapper) {
        var self = this;
        API.vendas.listar().then(function(vendas) {
            wrapper.innerHTML = '';
            self.renderContent(wrapper, vendas);
        }).catch(function(err) {
            wrapper.innerHTML = '';
            console.warn('[Vendas] API não disponível, usando dados locais:', err.message);
            self.renderContent(wrapper, DataStore.vendas);
        });
    },

    renderContent: function(wrapper, vendas) {
        var self = this;

        var receitaTotal = vendas.reduce(function(acc, v) { return acc + (v.total || 0); }, 0);
        var concluidas = vendas.filter(function(v) { return v.status === 'concluida'; });
        var pendentes = vendas.filter(function(v) { return v.status === 'pendente'; });
        var receitaConcluida = concluidas.reduce(function(acc, v) { return acc + (v.total || 0); }, 0);
        var ticketMedio = concluidas.length > 0 ? receitaConcluida / concluidas.length : 0;

        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';
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
            { key: 'acoes', label: 'Ações', align: 'center', width: '130px' }
        ];

        var rows = vendas.slice().reverse().map(function(v) {
            var itensDesc = '';
            if (v.itens && Array.isArray(v.itens)) {
                itensDesc = v.itens.map(function(item) {
                    var prodNome = '?';
                    if (item.produtoId && typeof item.produtoId === 'object' && item.produtoId.nome) {
                        prodNome = item.produtoId.nome;
                    } else if (item.produto) {
                        prodNome = item.produto.nome;
                    } else {
                        var prod = DataStore.getProdutoById(item.produtoId);
                        if (prod) prodNome = prod.nome;
                    }
                    return item.quantidade + 'x ' + prodNome;
                }).join(', ');
            }

            var shortId = v._id ? v._id.toString().substring(0, 6) : ('#' + v.id);
            var isPending = v.status === 'pendente';
            var acoesHtml = '';
            if (isPending) {
                acoesHtml += '<button class="btn btn-sm btn-success btn-registrar-pagamento" data-id="' + v._id + '" title="Registrar Pagamento" style="background:#059669;color:white;border:none;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer"><i class="fas fa-check"></i> Pagar</button> ';
            }
            acoesHtml += '<button class="btn-icon btn-view-venda" data-id="' + v._id + '" title="Ver Detalhes"><i class="fas fa-eye"></i></button> <button class="btn-icon btn-icon-danger btn-delete-venda" data-id="' + v._id + '" title="Excluir"><i class="fas fa-trash"></i></button>';

            return {
                id: '<strong>' + shortId + '</strong>',
                data: v.dataVenda ? DataStore.formatarData(v.dataVenda.split('T')[0]) : DataStore.formatarData(v.data),
                cliente: v.cliente,
                itens: '<span title="' + itensDesc + '">' + (v.itens ? v.itens.length : 0) + ' itens</span>',
                total: DataStore.formatarMoeda(v.total),
                pagamento: UI.paymentBadge(v.formaPagamento),
                status: UI.statusBadge(v.status),
                acoes: acoesHtml
            };
        });

        var table = UI.dataTable(headers, rows);
        var card = UI.card('Histórico de Vendas', table, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Nova Venda', cls: 'btn-primary', id: 'btn-nova-venda' }
        });
        wrapper.appendChild(card);

        // ---- Client Summary ----
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
        }).sort(function(a, b) { return b.compras - a.compras; });

        var clientTable = UI.dataTable(clientHeaders, clientRows);
        var clientCard = UI.card('Resumo por Cliente', clientTable);
        wrapper.appendChild(clientCard);

        // ---- Wire Buttons ----
        self.wireButtons(vendas);
    },

    wireButtons: function(vendas) {
        var self = this;

        var btnNova = document.getElementById('btn-nova-venda');
        if (btnNova) {
            btnNova.addEventListener('click', function() {
                self.showNewVendaModal(function() { self.reload(); });
            });
        }

        // Registrar Pagamento - change status from pendente → concluida
        document.querySelectorAll('.btn-registrar-pagamento').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                if (confirm('Confirmar o recebimento do pagamento desta venda?')) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
                    API.vendas.atualizarStatus(id, 'concluida').then(function() {
                        self.reload();
                    }).catch(function(err) {
                        alert('Erro ao registrar pagamento: ' + err.message);
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-check"></i> Pagar';
                    });
                }
            });
        });

        document.querySelectorAll('.btn-view-venda').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                self.showVendaDetalhes(id, vendas);
            });
        });

        document.querySelectorAll('.btn-delete-venda').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir esta venda? O estoque será restaurado.')) {
                    API.vendas.remover(id).then(function() {
                        self.reload();
                    }).catch(function(err) {
                        alert('Erro: ' + err.message);
                    });
                }
            });
        });
    },

    showNewVendaModal: function(onSave) {
        var self = this;

        // Load produtos for select
        API.produtos.listar({ status: 'ativo' }).then(function(produtos) {
            var content =
                '<div class="form-grid">' +
                '<div class="form-group">' +
                '<label>Cliente</label>' +
                '<input type="text" id="venda-field-cliente" class="form-input" placeholder="Ex: Supermercado Bom Preço">' +
                '</div>' +
                '<div class="form-group">' +
                '<label>Forma de Pagamento</label>' +
                '<select id="venda-field-pagamento" class="form-input">' +
                '<option value="Pix">Pix</option>' +
                '<option value="Cartão">Cartão</option>' +
                '<option value="Boleto">Boleto</option>' +
                '<option value="Dinheiro">Dinheiro</option>' +
                '</select>' +
                '</div>' +
                '</div>' +
                '<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0">' +
                '<h4 style="margin-bottom:8px">Itens da Venda</h4>' +
                '<div id="venda-itens-container">' +
                '<div class="venda-item-row">' +
                '<select class="form-input venda-item-produto" style="flex:2">' +
                '<option value="">Selecione um produto...</option>' +
                produtos.map(function(p) {
                    return '<option value="' + p._id + '" data-preco="' + p.precoVenda + '">' + p.nome + ' (R$ ' + p.precoVenda.toFixed(2) + ', Est: ' + p.quantidade + ' ' + p.unidade + ')</option>';
                }).join('') +
                '</select>' +
                '<input type="number" class="form-input venda-item-qtd" style="flex:0.5" min="1" value="1" placeholder="Qtd">' +
                '<button class="btn-icon btn-remove-item" style="flex:0;color:#ef4444" title="Remover"><i class="fas fa-times"></i></button>' +
                '</div>' +
                '</div>' +
                '<button class="btn btn-sm btn-outline" id="btn-add-item" style="margin-top:8px"><i class="fas fa-plus"></i> Adicionar Item</button>' +
                '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
                '<button class="btn btn-outline" id="venda-btn-cancel">Cancelar</button>' +
                '<button class="btn btn-primary" id="venda-btn-save"><i class="fas fa-shopping-cart"></i> Finalizar Venda</button>' +
                '</div>';

            var modal = UI.modal('venda-form', 'Nova Venda', content, { size: 'lg' });

            document.getElementById('venda-btn-cancel').addEventListener('click', modal.close);

            // Add item button
            document.getElementById('btn-add-item').addEventListener('click', function() {
                var container = document.getElementById('venda-itens-container');
                var row = document.createElement('div');
                row.className = 'venda-item-row';
                row.innerHTML =
                    '<select class="form-input venda-item-produto" style="flex:2">' +
                    '<option value="">Selecione um produto...</option>' +
                    produtos.map(function(p) {
                        return '<option value="' + p._id + '" data-preco="' + p.precoVenda + '">' + p.nome + ' (R$ ' + p.precoVenda.toFixed(2) + ')</option>';
                    }).join('') +
                    '</select>' +
                    '<input type="number" class="form-input venda-item-qtd" style="flex:0.5" min="1" value="1" placeholder="Qtd">' +
                    '<button class="btn-icon btn-remove-item" style="flex:0;color:#ef4444" title="Remover"><i class="fas fa-times"></i></button>';
                container.appendChild(row);

                row.querySelector('.btn-remove-item').addEventListener('click', function() {
                    row.remove();
                });
            });

            // Remove existing items
            document.querySelectorAll('.btn-remove-item').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    btn.closest('.venda-item-row').remove();
                });
            });

            document.getElementById('venda-btn-save').addEventListener('click', function() {
                var cliente = document.getElementById('venda-field-cliente').value.trim();
                var pagamento = document.getElementById('venda-field-pagamento').value;

                if (!cliente) {
                    alert('Nome do cliente é obrigatório.');
                    return;
                }

                var itensData = [];
                var rows = document.querySelectorAll('.venda-item-row');
                for (var i = 0; i < rows.length; i++) {
                    var select = rows[i].querySelector('.venda-item-produto');
                    var qtd = rows[i].querySelector('.venda-item-qtd');
                    if (select.value && parseInt(qtd.value) > 0) {
                        itensData.push({
                            produtoId: select.value,
                            quantidade: parseInt(qtd.value)
                        });
                    }
                }

                if (itensData.length === 0) {
                    alert('Adicione pelo menos um item à venda.');
                    return;
                }

                var saveBtn = document.getElementById('venda-btn-save');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processando...';

                API.vendas.criar({
                    cliente: cliente,
                    itens: itensData,
                    formaPagamento: pagamento
                }).then(function() {
                    modal.close();
                    if (onSave) onSave();
                }).catch(function(err) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Finalizar Venda';
                    alert('Erro: ' + err.message);
                });
            });
        }).catch(function(err) {
            alert('Erro ao carregar produtos: ' + err.message);
        });
    },

    showVendaDetalhes: function(id, vendas) {
        var venda = null;
        for (var i = 0; i < vendas.length; i++) {
            if (vendas[i]._id === id) { venda = vendas[i]; break; }
        }
        if (!venda) {
            alert('Venda não encontrada.');
            return;
        }

        var itensHtml = '<table class="data-table" style="margin-top:8px"><thead><tr><th>Produto</th><th align="center">Qtd</th><th align="right">Preço Un.</th><th align="right">Subtotal</th></tr></thead><tbody>';
        if (venda.itens && Array.isArray(venda.itens)) {
            venda.itens.forEach(function(item) {
                var prodNome = '?';
                if (item.produto && item.produto.nome) prodNome = item.produto.nome;
                else {
                    var prod = DataStore.getProdutoById(item.produtoId);
                    if (prod) prodNome = prod.nome;
                }
                var preco = item.precoUnitario || 0;
                var subtotal = item.quantidade * preco;
                itensHtml += '<tr><td>' + prodNome + '</td><td align="center">' + item.quantidade + '</td><td align="right">' + DataStore.formatarMoeda(preco) + '</td><td align="right">' + DataStore.formatarMoeda(subtotal) + '</td></tr>';
            });
        }
        itensHtml += '</tbody></table>';

        var dataVenda = venda.dataVenda ? DataStore.formatarData(venda.dataVenda.split('T')[0]) : DataStore.formatarData(venda.data);

        var content =
            '<div style="margin-bottom:12px">' +
            '<p><strong>Cliente:</strong> ' + venda.cliente + '</p>' +
            '<p><strong>Data:</strong> ' + dataVenda + '</p>' +
            '<p><strong>Forma de Pagamento:</strong> ' + venda.formaPagamento + '</p>' +
            '<p><strong>Status:</strong> ' + UI.statusBadge(venda.status) + '</p>' +
            '<p><strong>Total:</strong> <span style="font-size:20px;font-weight:700">' + DataStore.formatarMoeda(venda.total) + '</span></p>' +
            '</div>' +
            '<h4>Itens</h4>' + itensHtml +
            '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
            '<button class="btn btn-outline" id="detail-btn-close">Fechar</button>';

        var modal = UI.modal('venda-detail', 'Venda #' + venda._id.toString().substring(0, 6), content, { size: 'md' });
        document.getElementById('detail-btn-close').addEventListener('click', modal.close);
    },

    reload: function() {
        Router.goTo('vendas');
    }
};