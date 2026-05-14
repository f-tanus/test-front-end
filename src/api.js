/* =======================================
   QUEIJARIA CORP - API Client
   Supports both local dev and Render deployment
   ======================================= */

const API = (() => {
    // Render deployment URL (the actual URL after deploy)
    const RENDER_URL = 'https://queijaria-corp-backend.onrender.com/api';
    // Local development
    const LOCAL_HOST = window.location.hostname || 'localhost';
    const LOCAL_PORT = 3001;
    const LOCAL_URL = 'http://' + LOCAL_HOST + ':' + LOCAL_PORT + '/api';

    let BASE_URL = LOCAL_URL;
    let discovered = false;
    let useLocal = true;

    async function discoverServer() {
        if (discovered) return;

        // First, try the Render URL (for production)
        try {
            const renderResp = await fetch(RENDER_URL + '/health', {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            if (renderResp.ok) {
                BASE_URL = RENDER_URL;
                discovered = true;
                useLocal = false;
                console.log('[API] Conectado ao servidor Render');
                return;
            }
        } catch (e) {
            // Render not available, try local
        }

        // Try local server on common ports
        const ports = [LOCAL_PORT, 3001, 3002, 3003, 3004, 3005];
        for (const port of ports) {
            try {
                const testUrl = 'http://' + LOCAL_HOST + ':' + port + '/api/health';
                const resp = await fetch(testUrl, {
                    method: 'GET',
                    signal: AbortSignal.timeout(500)
                });
                if (resp.ok) {
                    BASE_URL = 'http://' + LOCAL_HOST + ':' + port + '/api';
                    discovered = true;
                    console.log('[API] Servidor local encontrado em http://' + LOCAL_HOST + ':' + port);
                    return;
                }
            } catch (e) {
                // Port not available
            }
        }

        console.warn('[API] Servidor não encontrado. Usando localhost:3001');
        discovered = true;
    }

    async function request(endpoint, options) {
        options = options || {};
        if (!discovered) {
            await discoverServer();
        }

        const url = BASE_URL + endpoint;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const error = await response.json().catch(function() { return {}; });
                throw new Error(error.erro || 'Erro HTTP ' + response.status);
            }
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError' || (error.name === 'TypeError' && error.message.includes('fetch'))) {
                throw new Error('Servidor não disponível. Execute "npm start" no diretório backend/.');
            }
            throw error;
        }
    }

    // Build query string helper
    function buildQuery(params) {
        params = params || {};
        const keys = Object.keys(params);
        if (keys.length === 0) return '';
        return '?' + keys.map(function(k) {
            return k + '=' + encodeURIComponent(params[k]);
        }).join('&');
    }

    // Produtos
    const produtos = {
        listar: function(params) {
            return request('/produtos' + buildQuery(params));
        },
        obter: function(id) { return request('/produtos/' + id); },
        criar: function(data) {
            return request('/produtos', { method: 'POST', body: JSON.stringify(data) });
        },
        atualizar: function(id, data) {
            return request('/produtos/' + id, { method: 'PUT', body: JSON.stringify(data) });
        },
        remover: function(id) { return request('/produtos/' + id, { method: 'DELETE' }); },
        resumo: function() { return request('/produtos/resumo'); }
    };

    // Materiais
    const materiais = {
        listar: function(params) {
            return request('/materiais' + buildQuery(params));
        },
        obter: function(id) { return request('/materiais/' + id); },
        criar: function(data) {
            return request('/materiais', { method: 'POST', body: JSON.stringify(data) });
        },
        atualizar: function(id, data) {
            return request('/materiais/' + id, { method: 'PUT', body: JSON.stringify(data) });
        },
        remover: function(id) { return request('/materiais/' + id, { method: 'DELETE' }); },
        resumo: function() { return request('/materiais/resumo'); },
        baixoEstoque: function() { return request('/materiais/baixo-estoque'); }
    };

    // Vendas
    const vendas = {
        listar: function(params) {
            return request('/vendas' + buildQuery(params));
        },
        obter: function(id) { return request('/vendas/' + id); },
        criar: function(data) {
            return request('/vendas', { method: 'POST', body: JSON.stringify(data) });
        },
        atualizarStatus: function(id, status) {
            return request('/vendas/' + id + '/status', {
                method: 'PATCH',
                body: JSON.stringify({ status: status })
            });
        },
        remover: function(id) { return request('/vendas/' + id, { method: 'DELETE' }); },
        resumo: function(mes, ano) {
            const params = {};
            if (mes) params.mes = mes;
            if (ano) params.ano = ano;
            return request('/vendas/resumo' + buildQuery(params));
        }
    };

    const health = function() { return request('/health'); };

    return {
        produtos: produtos,
        materiais: materiais,
        vendas: vendas,
        health: health,
        discoverServer: discoverServer,
        getBaseUrl: function() { return BASE_URL; }
    };
})();