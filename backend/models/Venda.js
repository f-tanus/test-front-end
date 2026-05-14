const mongoose = require('mongoose');

const ItemVendaSchema = new mongoose.Schema({
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true, min: 0 }
}, { _id: false });

const VendaSchema = new mongoose.Schema({
    cliente: { type: String, required: true, trim: true },
    itens: { type: [ItemVendaSchema], required: true, validate: v => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    formaPagamento: { type: String, required: true, enum: ['Pix', 'Cartão', 'Boleto', 'Dinheiro'] },
    status: { type: String, default: 'pendente', enum: ['pendente', 'concluida', 'cancelada'] },
    dataVenda: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Venda', VendaSchema);