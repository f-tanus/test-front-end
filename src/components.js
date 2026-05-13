/* =======================================
   QUEIJARIA CORP - Shared Components
   ======================================= */

const UI = {
    /** Creates a stat card with icon, label, value, trend */
    statCard: function({ icon, label, value, trend, trendValue, color = '#6366f1', bg = '#eef2ff' }) {
        const el = document.createElement('div');
        el.className = 'stat-card';
        el.innerHTML =
            '<div class="stat-card-header">' +
            '<div class="stat-icon" style="background:' + bg + '; color:' + color + '">' + icon + '</div>' +
            '<span class="stat-trend ' + (trend || '') + '">' + (trendValue || '') + '</span>' +
            '</div>' +
            '<div class="stat-value">' + value + '</div>' +
            '<div class="stat-label">' + label + '</div>';
        return el;
    },

    /** Data table with headers and rows */
    dataTable: function(headers, rows, options) {
        options = options || {};
        var emptyMsg = options.emptyMsg || 'Nenhum registro encontrado.';
        var onRowClick = options.onRowClick;
        var table = document.createElement('table');
        table.className = 'data-table';

        var thead = document.createElement('thead');
        var tr = document.createElement('tr');
        headers.forEach(function(h) {
            var th = document.createElement('th');
            th.textContent = h.label;
            if (h.width) th.style.width = h.width;
            if (h.align) th.style.textAlign = h.align;
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        if (rows.length === 0) {
            var emptyTr = document.createElement('tr');
            var td = document.createElement('td');
            td.colSpan = headers.length;
            td.className = 'empty-state';
            td.textContent = emptyMsg;
            emptyTr.appendChild(td);
            tbody.appendChild(emptyTr);
        } else {
            rows.forEach(function(row, idx) {
                var tr = document.createElement('tr');
                if (onRowClick) {
                    tr.style.cursor = 'pointer';
                    tr.addEventListener('click', function() { onRowClick(row, idx); });
                }
                headers.forEach(function(h) {
                    var td = document.createElement('td');
                    var val = row[h.key];
                    td.innerHTML = val !== undefined && val !== null ? val : '-';
                    if (h.align) td.style.textAlign = h.align;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        return table;
    },

    /** Badge for status */
    statusBadge: function(status) {
        var map = {
            ativo: { text: 'Ativo', cls: 'badge-success' },
            inativo: { text: 'Inativo', cls: 'badge-danger' },
            concluida: { text: 'Concluida', cls: 'badge-success' },
            pendente: { text: 'Pendente', cls: 'badge-warning' }
        };
        var s = map[status] || { text: status, cls: 'badge-default' };
        return '<span class="badge ' + s.cls + '">' + s.text + '</span>';
    },

    /** Badge for payment method */
    paymentBadge: function(method) {
        var map = {
            Pix: '<i class="fas fa-qrcode"></i> Pix',
            'Cartão': '<i class="fas fa-credit-card"></i> Cartão',
            Boleto: '<i class="fas fa-barcode"></i> Boleto'
        };
        return '<span class="payment-badge">' + (map[method] || method) + '</span>';
    },

    /** Card with optional header */
    card: function(title, content, extra) {
        extra = extra || {};
        var card = document.createElement('div');
        card.className = 'card';
        if (extra.className) card.classList.add(extra.className);

        var headerHtml = '';
        if (title) {
            headerHtml =
                '<div class="card-header">' +
                '<h3>' + (extra.icon || '') + ' ' + title + '</h3>';
            if (extra.actionBtn) {
                headerHtml += '<button class="btn btn-sm ' + (extra.actionBtn.cls || 'btn-primary') + '" id="' + (extra.actionBtn.id || '') + '">' + extra.actionBtn.label + '</button>';
            }
            headerHtml += '</div>';
        }
        var bodyContent = typeof content === 'string' ? content : '';
        card.innerHTML = headerHtml + '<div class="card-body">' + bodyContent + '</div>';

        var body = card.querySelector('.card-body');
        if (typeof content !== 'string' && content) {
            if (Array.isArray(content)) {
                content.forEach(function(el) { body.appendChild(el); });
            } else {
                body.appendChild(content);
            }
        }
        return card;
    },

    /** Modal component */
    modal: function(id, title, content, options) {
        options = options || {};
        var size = options.size || 'md';
        var onClose = options.onClose;

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = id + '-overlay';

        var modal = document.createElement('div');
        modal.className = 'modal modal-' + size;
        modal.id = id;
        modal.innerHTML =
            '<div class="modal-header">' +
            '<h3>' + title + '</h3>' +
            '<button class="modal-close">&times;</button>' +
            '</div>' +
            '<div class="modal-body"></div>';

        var body = modal.querySelector('.modal-body');
        if (typeof content === 'string') body.innerHTML = content;
        else if (content) body.appendChild(content);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        var closeBtn = modal.querySelector('.modal-close');
        var close = function() { overlay.remove(); if (onClose) onClose(); };
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

        return { overlay: overlay, modal: modal, body: body, close: close };
    },

    /** Section header with subtitle */
    sectionHeader: function(title, subtitle) {
        var div = document.createElement('div');
        div.className = 'section-header';
        div.innerHTML = '<h2>' + title + '</h2>' + (subtitle ? '<p>' + subtitle + '</p>' : '');
        return div;
    },

    /** Tabs component */
    tabs: function(tabItems, activeTab) {
        if (activeTab === undefined) activeTab = 0;
        var container = document.createElement('div');
        container.className = 'tabs-container';

        var nav = document.createElement('div');
        nav.className = 'tabs-nav';

        var contents = document.createElement('div');
        contents.className = 'tabs-content';

        var panels = [];

        tabItems.forEach(function(tab, i) {
            var btn = document.createElement('button');
            btn.className = 'tab-btn' + (i === activeTab ? ' active' : '');
            btn.textContent = tab.label;
            btn.addEventListener('click', function() {
                nav.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                contents.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
                panels[i].classList.add('active');
            });
            nav.appendChild(btn);

            var panel = document.createElement('div');
            panel.className = 'tab-panel' + (i === activeTab ? ' active' : '');
            if (typeof tab.content === 'string') panel.innerHTML = tab.content;
            else if (tab.content) panel.appendChild(tab.content);
            contents.appendChild(panel);
            panels.push(panel);
        });

        container.appendChild(nav);
        container.appendChild(contents);
        return container;
    },

    /** Loading spinner */
    spinner: function() {
        var div = document.createElement('div');
        div.className = 'spinner';
        div.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        return div;
    },

    /** Format currency, data etc. Delegates to DataStore */
    money: function(val) { return DataStore.formatarMoeda(val); },
    date: function(val) { return DataStore.formatarData(val); }
};