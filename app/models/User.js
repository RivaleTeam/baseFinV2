const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');
const { generateExternalId } = require('../utils/generateId');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Criar usuário com hash da senha
  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const userData = {
      ...data,
      external_id: generateExternalId('USR', 12),
      password_hash: hashedPassword,
      balance: 0.0,
      blocked_balance: 0.0,
      status: 'active'
    };

    delete userData.password;
    return await super.create(userData);
  }

  // Buscar por email
  async findByEmail(email) {
    return await this.db(this.tableName).where('email', email).first();
  }

  // Buscar por username
  async findByUsername(username) {
    return await this.db(this.tableName).where('username', username).first();
  }

  // Verificar senha
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Atualizar saldo
  async updateBalance(userId, amount, type = 'adjustment') {
    const user = await this.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const newBalance = parseFloat(user.balance) + parseFloat(amount);
    
    if (newBalance < 0) {
      throw new Error('Saldo insuficiente');
    }

    await this.update(userId, { balance: newBalance });
    
    // Registrar transação
    const Transaction = require('./Transaction');
    const transactionModel = new Transaction();
    
    await transactionModel.create({
      user_id: userId,
      type: type,
      amount: amount,
      balance_before: user.balance,
      balance_after: newBalance,
      metadata: { updated_by: 'system' }
    });

    return await this.findById(userId);
  }

  // Bloquear saldo
  async blockBalance(userId, amount) {
    const user = await this.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const availableBalance = parseFloat(user.balance) - parseFloat(user.blocked_balance);
    
    if (availableBalance < parseFloat(amount)) {
      throw new Error('Saldo insuficiente para bloqueio');
    }

    const newBlockedBalance = parseFloat(user.blocked_balance) + parseFloat(amount);
    
    await this.update(userId, { blocked_balance: newBlockedBalance });
    
    return await this.findById(userId);
  }

  // Desbloquear saldo
  async unblockBalance(userId, amount) {
    const user = await this.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const newBlockedBalance = Math.max(0, parseFloat(user.blocked_balance) - parseFloat(amount));
    
    await this.update(userId, { blocked_balance: newBlockedBalance });
    
    return await this.findById(userId);
  }

  // Buscar usuários ativos
  async findActive() {
    return await this.findWhere({ status: 'active' });
  }
}

module.exports = User;