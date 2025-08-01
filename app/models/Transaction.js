const BaseModel = require('./BaseModel');
const { generateExternalId } = require('../utils/generateId');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  async create(data) {
    const transactionData = {
      ...data,
      external_id: generateExternalId('TRX', 12)
    };

    return await super.create(transactionData);
  }

  // Buscar transações por usuário
  async findByUserId(userId, limit = 50) {
    return await this.db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Buscar transações por tipo
  async findByType(type, limit = 100) {
    return await this.db(this.tableName)
      .where('type', type)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Saldo total de transações por usuário
  async getUserBalance(userId) {
    const result = await this.db(this.tableName)
      .where('user_id', userId)
      .sum('amount as total');
    
    return parseFloat(result[0].total) || 0;
  }

  // Relatório de transações por período
  async getTransactionReport(startDate, endDate, type = null) {
    let query = this.db(this.tableName)
      .whereBetween('created_at', [startDate, endDate]);
    
    if (type) {
      query = query.where('type', type);
    }

    return await query
      .select('type')
      .sum('amount as total_amount')
      .count('* as count')
      .groupBy('type');
  }
}

module.exports = Transaction;