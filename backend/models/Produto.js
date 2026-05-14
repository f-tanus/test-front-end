const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    tipo: { type: String, required: true, enum: ['Frescal', 'Curado', 'Azul', 'Macio', 'Processado'] },
    quantidade: { type: Number, default: 0, min: 0 },
    unidade: { type: String, default: 'kg', enum: ['kg', 'un', 'L'] },
    precoVenda: { type: Number, required: true, min: 0 },
    custoProducao: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'ativo', enum: ['ativo', 'inativo'] }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: margem percentual
ProdutoSchema.virtual('margem').get(function() {
    if (this.precoVenda <= 0) return 0;
    return ((this.precoVenda - this.custoProducao) / this.precoVenda * 100).toFixed(1);
});

module.exports = mongoose.model('Produto', ProdutoSchema);