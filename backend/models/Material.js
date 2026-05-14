const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, enum: ['Matéria-Prima', 'Insumo', 'Embalagem', 'Logística'] },
    quantidade: { type: Number, default: 0, min: 0 },
    unidade: { type: String, default: 'un', enum: ['kg', 'L', 'un'] },
    estoqueMinimo: { type: Number, default: 10, min: 0 },
    custoUnidade: { type: Number, required: true, min: 0 },
    fornecedor: { type: String, trim: true, default: '' },
    status: { type: String, default: 'ativo', enum: ['ativo', 'inativo'] }
}, {
    timestamps: true
});

module.exports = mongoose.model('Material', MaterialSchema);