const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rota para cadastro de usuário
router.post('/', userController.register);

// Rota para verificar credenciais
router.post('/verify', userController.verifyCredentials);

// Rota para atualizar usuário
router.put('/:userId', userController.updateUser);

module.exports = router;