require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const app = express();
const START_PORT = parseInt(process.env.PORT) || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/materiais', require('./routes/materiais'));
app.use('/api/vendas', require('./routes/vendas'));

// API Info
app.get('/api', (req, res) => {
    res.json({
        nome: 'Queijaria Corp API',
        versao: '1.0.0',
        database: 'MongoDB Atlas',
        endpoints: {
            produtos: '/api/produtos',
            materiais: '/api/materiais',
            vendas: '/api/vendas'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    const dbState = require('mongoose').connection.readyState;
    const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: dbState === 1 ? 'ok' : 'error',
        database: 'MongoDB Atlas',
        dbStatus: dbStatus[dbState] || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERRO]', err.stack);
    res.status(500).json({ erro: 'Erro interno do servidor' });
});

/**
 * Try to listen on a port. If EADDRINUSE, try the next port
 */
function tryListen(port, maxPort) {
    var server = app.listen(port, '0.0.0.0', function() {
        var actualPort = server.address().port;
        console.log('');
        console.log('========================================');
        console.log('  QUEIJARIA CORP - API REST');
        console.log('========================================');
        console.log('  Database:  MongoDB Atlas');
        console.log('  Servidor:  http://localhost:' + actualPort);
        console.log('  Ambiente:  ' + (process.env.NODE_ENV || 'development'));
        console.log('========================================');
        console.log('');
        console.log('  Endpoints:');
        console.log('  GET  /api              - Informações da API');
        console.log('  GET  /api/health       - Health check');
        console.log('  GET  /api/produtos     - Listar produtos');
        console.log('  POST /api/produtos     - Criar produto');
        console.log('  GET  /api/materiais    - Listar materiais');
        console.log('  POST /api/materiais    - Criar material');
        console.log('  GET  /api/vendas       - Listar vendas');
        console.log('  POST /api/vendas       - Criar venda');
        console.log('');
    });

    server.on('error', function(err) {
        if (err.code === 'EADDRINUSE') {
            var nextPort = port + 1;
            if (nextPort > maxPort) {
                console.error('Não foi possível encontrar uma porta livre entre', START_PORT, 'e', maxPort);
                process.exit(1);
                return;
            }
            console.log('  [aviso] Porta ' + port + ' em uso, tentando ' + nextPort + '...');
            server.close();
            tryListen(nextPort, maxPort);
        } else {
            console.error('Erro ao iniciar servidor:', err.message);
            process.exit(1);
        }
    });
}

// Start
console.log('Iniciando Queijaria Corp API...');
console.log('Conectando ao MongoDB Atlas...');

connectDB().then(() => {
    tryListen(START_PORT, START_PORT + 50);
}).catch((err) => {
    console.error('Falha ao conectar ao MongoDB:', err);
    process.exit(1);
});