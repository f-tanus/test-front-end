const express = require('express');
const router = express.Router();
const controller = require('../controllers/materialController');

router.get('/resumo', controller.resumo);
router.get('/baixo-estoque', controller.baixoEstoque);
router.get('/', controller.listar);
router.get('/:id', controller.obterPorId);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.remover);

module.exports = router;