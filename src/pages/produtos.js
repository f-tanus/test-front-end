/* =======================================
   QUEIJARIA CORP - Produtos Page
   Data from API, interactive CRUD buttons
   ======================================= */

const ProdutosPage = {
    refreshInterval: null,

    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = '<div class="page-loading"><i class="fas fa-circle-notch fa-spin"></i> Carregando produtos...</div>';
        this.loadProdutos(wrapper);
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
            self.loadProdutos(wrapper);
        }, 30000);
    },

    loadProdutos: function(wrapper) {
        var self = this;

        API.produtos.listar().then(function(produtos) {
            API.produtos.resumo().then(function(resumo) {
                wrapper.innerHTML = '';
                self.renderContent(wrapper, produtos, resumo);
            }).catch(function() {
                wrapper.innerHTML = '';
                self.renderContent(wrapper, produtos, null);
            });
        }).catch(function(err) {
            // Fallback to DataStore
            wrapper.innerHTML = '';
            console.warn('[Produtos] API não disponível, usando dados locais:', err.message);
            self.renderContent(wrapper, DataStore.produtos, null);
        });
    },

    renderContent: function(wrapper, produtos, resumo) {
        var self = this;

        // ---- KPI Row ----
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';

        var ativos = produtos.filter(function(p) { return p.status === 'ativo'; });
        var valorEstoque = ativos.reduce(function(acc, p) { return acc + (p.quantidade * p.precoVenda); }, 0);
        var margemMedia = ativos.length > 0 ?
            ativos.reduce(function(acc, p) {
                var m = p.precoVenda > 0 ? ((p.precoVenda - p.custoProducao) / p.precoVenda) * 100 : 0;
                return acc + m;
            }, 0) / ativos.length :
            0;

        // Use resumo from API if available
        var total = produtos.length;
        var totalAtivos = ativos.length;

        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-cheese"></i>',
            label: 'Total de Produtos',
            value: total,
            color: '#6366f1',
            bg: '#eef2ff'
        }));
        kpiRow.appendChild(UI.statCard({
            icon: '<i class="fas fa-box"></i>',
            label: 'Produtos Ativos',
            value: totalAtivos,
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
            var margem = p.precoVenda > 0 ? ((p.precoVenda - p.custoProducao) / p.precoVenda) * 100 : 0;
            var margemColor = margem > 40 ? '#059669' : margem > 25 ? '#d97706' : '#ef4444';
            return {
                nome: '<span class="product-cell"><span class="product-emoji">🧀</span> <strong>' + p.nome + '</strong></span>',
                tipo: '<span class="tipo-badge">' + p.tipo + '</span>',
                estoque: p.quantidade + ' ' + p.unidade,
                preco: DataStore.formatarMoeda(p.precoVenda),
                custo: DataStore.formatarMoeda(p.custoProducao),
                margem: '<span style="color:' + margemColor + ';font-weight:600">' + margem.toFixed(1) + '%</span>',
                status: UI.statusBadge(p.status),
                acoes: '<button class="btn-icon btn-edit-produto" data-id="' + p._id + '" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-icon btn-icon-danger btn-delete-produto" data-id="' + p._id + '" data-nome="' + p.nome + '" title="Excluir"><i class="fas fa-trash"></i></button>'
            };
        });

        var table = UI.dataTable(headers, rows);
        var card = UI.card('Catálogo de Produtos', table, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Novo Produto', cls: 'btn-primary', id: 'btn-novo-produto' }
        });
        wrapper.appendChild(card);

        // ---- Wire Buttons ----
        self.wireButtons(produtos);
    },

    wireButtons: function(produtos) {
        var self = this;

        // Novo Produto
        var btnNovo = document.getElementById('btn-novo-produto');
        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                self.showFormModal(null, function() {
                    self.loadProdutos(document.getElementById('content-wrapper'));
                });
            });
        }

        // Editar Produto
        document.querySelectorAll('.btn-edit-produto').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var produto = null;
                // Find in loaded produtos or fetch
                for (var i = 0; i < produtos.length; i++) {
                    if (produtos[i]._id === id) { produto = produtos[i]; break; }
                }
                self.showFormModal(produto, function() {
                    self.loadProdutos(document.getElementById('content-wrapper'));
                });
            });
        });

        // Excluir Produto
        document.querySelectorAll('.btn-delete-produto').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var nome = btn.getAttribute('data-nome');
                if (confirm('Tem certeza que deseja excluir "' + nome + '"?')) {
                    self.deleteProduto(id);
                }
            });
        });
    },

    showFormModal: function(produto, onSave) {
        var isEdit = !!produto;
        var title = isEdit ? 'Editar Produto' : 'Novo Produto';

        var tipos = ['Frescal', 'Curado', 'Azul', 'Macio', 'Processado'];
        var unidades = ['kg', 'un', 'L'];

        var optionsHtml = tipos.map(function(t) {
            return '<option value="' + t + '"' + (isEdit && produto.tipo === t ? ' selected' : '') + '>' + t + '</option>';
        }).join('');
        var unidOptions = unidades.map(function(u) {
            return '<option value="' + u + '"' + (isEdit && produto.unidade === u ? ' selected' : '') + '>' + u + '</option>';
        }).join('');

        var content =
            '<div class="form-grid">' +
            '<div class="form-group">' +
            '<label>Nome do Produto</label>' +
            '<input type="text" id="field-nome" class="form-input" value="' + (isEdit ? produto.nome : '') + '" placeholder="Ex: Mussarela">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tipo</label>' +
            '<select id="field-tipo" class="form-input">' + optionsHtml + '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Quantidade</label>' +
            '<input type="number" id="field-quantidade" class="form-input" value="' + (isEdit ? produto.quantidade : '0') + '" min="0" step="1">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Unidade</label>' +
            '<select id="field-unidade" class="form-input">' + unidOptions + '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Preço de Venda (R$)</label>' +
            '<input type="number" id="field-preco" class="form-input" value="' + (isEdit ? produto.precoVenda : '') + '" min="0" step="0.01">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Custo de Produção (R$)</label>' +
            '<input type="number" id="field-custo" class="form-input" value="' + (isEdit ? produto.custoProducao : '') + '" min="0" step="0.01">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Status</label>' +
            '<select id="field-status" class="form-input">' +
            '<option value="ativo"' + (isEdit && produto.status === 'ativo' ? ' selected' : '') + '>Ativo</option>' +
            '<option value="inativo"' + (isEdit && produto.status === 'inativo' ? ' selected' : '') + '>Inativo</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
            '<button class="btn btn-outline" id="btn-form-cancel">Cancelar</button>' +
            '<button class="btn btn-primary" id="btn-form-save">' + (isEdit ? 'Salvar' : 'Criar') + '</button>' +
            '</div>';

        var modal = UI.modal('produto-form', title, content, { size: 'md' });

        document.getElementById('btn-form-cancel').addEventListener('click', modal.close);

        document.getElementById('btn-form-save').addEventListener('click', function() {
            var data = {
                nome: document.getElementById('field-nome').value.trim(),
                tipo: document.getElementById('field-tipo').value,
                quantidade: parseFloat(document.getElementById('field-quantidade').value) || 0,
                unidade: document.getElementById('field-unidade').value,
                precoVenda: parseFloat(document.getElementById('field-preco').value) || 0,
                custoProducao: parseFloat(document.getElementById('field-custo').value) || 0,
                status: document.getElementById('field-status').value
            };

            if (!data.nome) {
                alert('Nome do produto é obrigatório.');
                return;
            }
            if (data.precoVenda <= 0) {
                alert('Preço de venda deve ser maior que zero.');
                return;
            }

            var saveBtn = document.getElementById('btn-form-save');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Salvando...';

            var promise = isEdit ?
                API.produtos.atualizar(produto._id, data) :
                API.produtos.criar(data);

            promise.then(function() {
                modal.close();
                if (onSave) onSave();
            }).catch(function(err) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = isEdit ? 'Salvar' : 'Criar';
                alert('Erro: ' + err.message);
            });
        });
    },

    deleteProduto: function(id) {
        var self = this;
        API.produtos.remover(id).then(function() {
            self.loadProdutos(document.getElementById('content-wrapper'));
        }).catch(function(err) {
            alert('Erro ao excluir: ' + err.message);
        });
    }
};