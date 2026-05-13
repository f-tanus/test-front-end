const express = require('express');
const router = express.Router();
const controller = require('../controllers/vendaController');

router.get('/resumo', controller.resumo);
router.get('/', controller.listar);
router.get('/:id', controller.obterPorId);
router.post('/', controller.criar);
router.patch('/:id/status', controller.atualizarStatus);
router.delete('/:id', controller.remover);

module.exports = router;