const express = require('express');
const router = express.Router();

// Middlewares
const { auth, optionalAuth } = require('../app/middlewares/auth');
const { validate } = require('../app/middlewares/validation');

// Validators
const { registerSchema, loginSchema } = require('../app/validators/authValidator');
const { createBetSchema } = require('../app/validators/betValidator');

// Controllers
const AuthController = require('../app/controllers/AuthController');
const UserController = require('../app/controllers/UserController');
const BalanceController = require('../app/controllers/BalanceController');

// Instâncias dos controllers
const authController = new AuthController();
const userController = new UserController();
const balanceController = new BalanceController();

// Rotas de autenticação
router.post('/session/register', validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/session/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/session/refresh', (req, res) => authController.refresh(req, res));
router.post('/session/logout', (req, res) => authController.logout(req, res));
router.get('/session/check', auth, (req, res) => authController.check(req, res));

// Rotas do usuário
router.get('/me', auth, (req, res) => userController.getProfile(req, res));
router.put('/me', auth, (req, res) => userController.updateProfile(req, res));
router.get('/me/transactions', auth, (req, res) => userController.getTransactions(req, res));

// Rotas de saldo
router.get('/balance', auth, (req, res) => balanceController.getBalance(req, res));
router.post('/balance/deposit', auth, (req, res) => balanceController.deposit(req, res));
router.post('/balance/withdraw', auth, (req, res) => balanceController.withdraw(req, res));
router.get('/balance/history', auth, (req, res) => balanceController.getHistory(req, res));

module.exports = router;