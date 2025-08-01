const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../app/middlewares/auth');

// Página inicial
router.get('/', optionalAuth, (req, res) => {
  res.render('pages/home', {
    title: 'Betting System',
    user: req.user
  });
});

// Página de login
router.get('/login', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/login', {
    title: 'Login - Betting System'
  });
});

// Página de registro
router.get('/register', optionalAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/register', {
    title: 'Registrar - Betting System'
  });
});

// Dashboard (requer autenticação)
router.get('/dashboard', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/dashboard', {
    title: 'Dashboard - Betting System',
    user: req.user
  });
});

// Página de saldo
router.get('/balance', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/balance', {
    title: 'Saldo - Betting System',
    user: req.user
  });
});


router.get('/games', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/games', {
    title: 'Saldo - Betting System',
    user: req.user,
    gameCost:5
  });
});

router.get('/affiliate', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  res.render('pages/affiliate', {
    title: 'affiliate - Betting System',
    user: req.user,
    gameCost:5
  });
});


module.exports = router;