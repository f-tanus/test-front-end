const mongoose = require('mongoose');

/**
 * MongoDB Connection via Mongoose
 */
const connectDB = async() => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('  [ERRO] MONGODB_URI não definida no arquivo .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log('  ✓ Conectado ao MongoDB Atlas');
        console.log('  ✓ Database: ' + mongoose.connection.db.databaseName);
    } catch (error) {
        console.error('  [ERRO] Falha na conexão com MongoDB:', error.message);
        throw error;
    }

    mongoose.connection.on('error', (err) => {
        console.error('[ERRO] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('[INFO] MongoDB disconnected');
    });
};

module.exports = { connectDB };