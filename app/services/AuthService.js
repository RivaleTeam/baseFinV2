const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Gerar token JWT
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  // Gerar refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  // Registrar usuário
  async register(userData) {
    const userModel = new User();
    
    // Verificar se email já existe
    const existingEmail = await userModel.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email já está em uso');
    }

    // Verificar se username já existe
    const existingUsername = await userModel.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username já está em uso');
    }

    // Criar usuário
    const user = await userModel.create(userData);
    
    // Gerar tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  // Login do usuário
  async login(email, password) {
    const userModel = new User();
    
    // Buscar usuário por email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha
    const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se conta está ativa
    if (user.status !== 'active') {
      throw new Error('Conta bloqueada ou inativa');
    }

    // Gerar tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken
    };
  }

  // Renovar token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Token de refresh inválido');
      }

      const userModel = new User();
      const user = await userModel.findById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new Error('Usuário inválido ou inativo');
      }

      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        user: this.sanitizeUser(user),
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Token de refresh inválido ou expirado');
    }
  }

  // Remover dados sensíveis do usuário
  sanitizeUser(user) {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = AuthService;