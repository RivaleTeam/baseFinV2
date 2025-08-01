const User = require('../models/User');
const Transaction = require('../models/Transaction');

class BalanceController {
  constructor() {
    this.userModel = new User();
    this.transactionModel = new Transaction();
  }

  // GET /api/balance
  async getBalance(req, res) {
    try {
      const user = await this.userModel.findById(req.user.id);
      
      res.json({
        success: true,
        data: {
          balance: parseFloat(user.balance),
          blocked_balance: parseFloat(user.blocked_balance),
          available_balance: parseFloat(user.balance) - parseFloat(user.blocked_balance),
          currency: 'BRL'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/balance/deposit
  async deposit(req, res) {
    try {
      const { amount, metadata = {} } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor do depósito deve ser maior que zero'
        });
      }

      const updatedUser = await this.userModel.updateBalance(
        req.user.id, 
        amount, 
        'deposit'
      );

      res.json({
        success: true,
        message: 'Depósito realizado com sucesso',
        data: {
          balance: parseFloat(updatedUser.balance),
          blocked_balance: parseFloat(updatedUser.blocked_balance),
          available_balance: parseFloat(updatedUser.balance) - parseFloat(updatedUser.blocked_balance),
          deposit_amount: parseFloat(amount)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/balance/withdraw
  async withdraw(req, res) {
    try {
      const { amount, metadata = {} } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor do saque deve ser maior que zero'
        });
      }

      const user = await this.userModel.findById(req.user.id);
      const availableBalance = parseFloat(user.balance) - parseFloat(user.blocked_balance);
      
      if (availableBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Saldo insuficiente para saque'
        });
      }

      const updatedUser = await this.userModel.updateBalance(
        req.user.id, 
        -amount, 
        'withdraw'
      );

      res.json({
        success: true,
        message: 'Saque realizado com sucesso',
        data: {
          balance: parseFloat(updatedUser.balance),
          blocked_balance: parseFloat(updatedUser.blocked_balance),
          available_balance: parseFloat(updatedUser.balance) - parseFloat(updatedUser.blocked_balance),
          withdraw_amount: parseFloat(amount)
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/balance/history
  async getHistory(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      
      let query = this.transactionModel.db('transactions')
        .where('user_id', req.user.id)
        .whereIn('type', ['deposit', 'withdraw', 'bonus', 'adjustment'])
        .orderBy('created_at', 'desc');

      if (type && ['deposit', 'withdraw', 'bonus', 'adjustment'].includes(type)) {
        query = query.where('type', type);
      }

      const offset = (page - 1) * limit;
      const transactions = await query.limit(limit).offset(offset);
      
      const totalQuery = this.transactionModel.db('transactions')
        .where('user_id', req.user.id)
        .whereIn('type', ['deposit', 'withdraw', 'bonus', 'adjustment']);
      
      if (type && ['deposit', 'withdraw', 'bonus', 'adjustment'].includes(type)) {
        totalQuery.where('type', type);
      }
      
      const total = await totalQuery.count('* as count');
      
      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total[0].count),
            pages: Math.ceil(total[0].count / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = BalanceController;