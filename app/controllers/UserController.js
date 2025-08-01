const User = require('../models/User');
const Transaction = require('../models/Transaction');

class UserController {
  constructor() {
    this.userModel = new User();
    this.transactionModel = new Transaction();
  }

  // GET /api/me
  async getProfile(req, res) {
    try {
      const user = await this.userModel.findById(req.user.id);

      if(user?.id){
        delete user.id;
      }
      
      res.json({
        success: true,
        data: {
          user: this.sanitizeUser(user)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // PUT /api/me
  async updateProfile(req, res) {
    try {
      const allowedFields = ['username', 'email'];
      const updateData = {};
      
      // Filtrar apenas campos permitidos
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo válido fornecido para atualização'
        });
      }

      // Verificar se email/username já existem
      if (updateData.email) {
        const existingUser = await this.userModel.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({
            success: false,
            message: 'Email já está em uso'
          });
        }
      }

      if (updateData.username) {
        const existingUser = await this.userModel.findByUsername(updateData.username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({
            success: false,
            message: 'Username já está em uso'
          });
        }
      }

      const updatedUser = await this.userModel.update(req.user.id, updateData);
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: this.sanitizeUser(updatedUser)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/me/transactions
  async getTransactions(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      
      let query = this.transactionModel.db('transactions')
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc')
        .select([
          'external_id',
          'type',
          'amount',
          'balance_before',
          'balance_after',
          'created_at'
        ]);

      if (type) {
        query = query.where('type', type);
      }

      const offset = (page - 1) * limit;
      const transactions = await query.limit(limit).offset(offset);
      
      const totalQuery = this.transactionModel.db('transactions')
        .where('user_id', req.user.id);
      
      if (type) {
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

  // Remover dados sensíveis
  sanitizeUser(user) {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = UserController;