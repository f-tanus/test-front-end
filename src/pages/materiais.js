/* =======================================
   QUEIJARIA CORP - Materiais Page
   Data from API, interactive CRUD buttons
   ======================================= */

const MateriaisPage = {
    refreshInterval: null,

    render: function() {
        var wrapper = document.getElementById('content-wrapper');
        wrapper.innerHTML = '<div class="page-loading"><i class="fas fa-circle-notch fa-spin"></i> Carregando materiais...</div>';
        this.loadMateriais(wrapper);
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
            self.loadMateriais(wrapper);
        }, 30000);
    },

    loadMateriais: function(wrapper) {
        var self = this;
        API.materiais.listar().then(function(materiais) {
            API.materiais.resumo().then(function(resumo) {
                wrapper.innerHTML = '';
                self.renderContent(wrapper, materiais, resumo);
            }).catch(function() {
                wrapper.innerHTML = '';
                self.renderContent(wrapper, materiais, null);
            });
        }).catch(function(err) {
            wrapper.innerHTML = '';
            console.warn('[Materiais] API não disponível, usando dados locais:', err.message);
            self.renderContent(wrapper, DataStore.materiais, null);
        });
    },

    renderContent: function(wrapper, materiais, resumo) {
        var self = this;

        var ativos = materiais.filter(function(m) { return m.status === 'ativo'; });
        var valorTotal = ativos.reduce(function(acc, m) { return acc + (m.quantidade * m.custoUnidade); }, 0);
        var baixoEstoque = ativos.filter(function(m) { return m.quantidade <= m.estoqueMinimo; });
        var categorias = {};
        ativos.forEach(function(m) {
            categorias[m.categoria] = (categorias[m.categoria] || 0) + 1;
        });

        // KPI Row
        var kpiRow = document.createElement('div');
        kpiRow.className = 'kpi-row';
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

        // Tabs
        var allTabContent = this.buildAllMaterialsTab(ativos, baixoEstoque);
        var catTabContent = this.buildCategoryTab(ativos, categorias);

        var tabs = UI.tabs([
            { label: 'Todos os Materiais', content: allTabContent },
            { label: 'Por Categoria', content: catTabContent }
        ]);

        var card = UI.card('Controle de Materiais', tabs, {
            actionBtn: { label: '<i class="fas fa-plus"></i> Novo Material', cls: 'btn-primary', id: 'btn-novo-material' }
        });
        wrapper.appendChild(card);

        // Wire buttons
        self.wireButtons(materiais);
    },

    buildAllMaterialsTab: function(ativos, baixoEstoque) {
        var baixoIds = baixoEstoque.map(function(m) { return m._id; });
        var headers = [
            { key: 'nome', label: 'Material' },
            { key: 'categoria', label: 'Categoria', align: 'center' },
            { key: 'estoque', label: 'Estoque', align: 'center' },
            { key: 'custo', label: 'Custo Un.', align: 'right' },
            { key: 'valorTotal', label: 'Valor Total', align: 'right' },
            { key: 'fornecedor', label: 'Fornecedor' },
            { key: 'acoes', label: 'Ações', align: 'center' }
        ];

        var rows = ativos.map(function(m) {
            var isLow = baixoIds.indexOf(m._id) !== -1;
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
                fornecedor: m.fornecedor || '-',
                acoes: '<button class="btn-icon btn-edit-material" data-id="' + m._id + '" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-icon btn-icon-danger btn-delete-material" data-id="' + m._id + '" data-nome="' + m.nome + '" title="Excluir"><i class="fas fa-trash"></i></button>'
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
    },

    wireButtons: function(materiais) {
        var self = this;

        var btnNovo = document.getElementById('btn-novo-material');
        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                self.showFormModal(null, function() { self.reload(); });
            });
        }

        document.querySelectorAll('.btn-edit-material').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var material = null;
                for (var i = 0; i < materiais.length; i++) {
                    if (materiais[i]._id === id) { material = materiais[i]; break; }
                }
                self.showFormModal(material, function() { self.reload(); });
            });
        });

        document.querySelectorAll('.btn-delete-material').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var nome = btn.getAttribute('data-nome');
                if (confirm('Tem certeza que deseja excluir "' + nome + '"?')) {
                    API.materiais.remover(id).then(function() {
                        self.reload();
                    }).catch(function(err) {
                        alert('Erro: ' + err.message);
                    });
                }
            });
        });
    },

    showFormModal: function(material, onSave) {
        var isEdit = !!material;
        var title = isEdit ? 'Editar Material' : 'Novo Material';

        var categorias = ['Matéria-Prima', 'Insumo', 'Embalagem', 'Logística'];
        var unidades = ['kg', 'L', 'un'];

        var catOptions = categorias.map(function(c) {
            return '<option value="' + c + '"' + (isEdit && material.categoria === c ? ' selected' : '') + '>' + c + '</option>';
        }).join('');
        var unidOptions = unidades.map(function(u) {
            return '<option value="' + u + '"' + (isEdit && material.unidade === u ? ' selected' : '') + '>' + u + '</option>';
        }).join('');

        var content =
            '<div class="form-grid">' +
            '<div class="form-group">' +
            '<label>Nome do Material</label>' +
            '<input type="text" id="mat-field-nome" class="form-input" value="' + (isEdit ? material.nome : '') + '" placeholder="Ex: Leite Integral">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Categoria</label>' +
            '<select id="mat-field-categoria" class="form-input">' + catOptions + '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Quantidade</label>' +
            '<input type="number" id="mat-field-quantidade" class="form-input" value="' + (isEdit ? material.quantidade : '0') + '" min="0">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Unidade</label>' +
            '<select id="mat-field-unidade" class="form-input">' + unidOptions + '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Estoque Mínimo</label>' +
            '<input type="number" id="mat-field-minimo" class="form-input" value="' + (isEdit ? material.estoqueMinimo : '10') + '" min="0">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Custo por Unidade (R$)</label>' +
            '<input type="number" id="mat-field-custo" class="form-input" value="' + (isEdit ? material.custoUnidade : '') + '" min="0" step="0.01">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Fornecedor</label>' +
            '<input type="text" id="mat-field-fornecedor" class="form-input" value="' + (isEdit ? (material.fornecedor || '') : '') + '" placeholder="Ex: Laticínios Vale Verde">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Status</label>' +
            '<select id="mat-field-status" class="form-input">' +
            '<option value="ativo"' + (isEdit && material.status === 'ativo' ? ' selected' : '') + '>Ativo</option>' +
            '<option value="inativo"' + (isEdit && material.status === 'inativo' ? ' selected' : '') + '>Inativo</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
            '<button class="btn btn-outline" id="mat-btn-cancel">Cancelar</button>' +
            '<button class="btn btn-primary" id="mat-btn-save">' + (isEdit ? 'Salvar' : 'Criar') + '</button>' +
            '</div>';

        var modal = UI.modal('material-form', title, content, { size: 'md' });

        document.getElementById('mat-btn-cancel').addEventListener('click', modal.close);

        document.getElementById('mat-btn-save').addEventListener('click', function() {
            var data = {
                nome: document.getElementById('mat-field-nome').value.trim(),
                categoria: document.getElementById('mat-field-categoria').value,
                quantidade: parseFloat(document.getElementById('mat-field-quantidade').value) || 0,
                unidade: document.getElementById('mat-field-unidade').value,
                estoqueMinimo: parseFloat(document.getElementById('mat-field-minimo').value) || 0,
                custoUnidade: parseFloat(document.getElementById('mat-field-custo').value) || 0,
                fornecedor: document.getElementById('mat-field-fornecedor').value.trim(),
                status: document.getElementById('mat-field-status').value
            };

            if (!data.nome) {
                alert('Nome do material é obrigatório.');
                return;
            }
            if (data.custoUnidade <= 0) {
                alert('Custo por unidade deve ser maior que zero.');
                return;
            }

            var saveBtn = document.getElementById('mat-btn-save');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Salvando...';

            var promise = isEdit ?
                API.materiais.atualizar(material._id, data) :
                API.materiais.criar(data);

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

    reload: function() {
        Router.goTo('materiais');
    }
};