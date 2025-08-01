const BaseModel = require('./BaseModel');
const { generateExternalId } = require('../utils/generateId');

class Bet extends BaseModel {
  constructor() {
    super('bets');
  }

  async create(data) {
    const betData = {
      ...data,
      external_id: generateExternalId('BET', 12),
      payout: 0,
      win: false
    };

    return await super.create(betData);
  }

  // Buscar apostas por usuário
  async findByUserId(userId, limit = 50) {
    return await this.db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Buscar apostas por jogo
  async findByGameId(gameId, limit = 100) {
    return await this.db(this.tableName)
      .where('game_id', gameId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Buscar apostas vencedoras
  async findWinningBets(limit = 100) {
    return await this.db(this.tableName)
      .where('win', true)
      .orderBy('payout', 'desc')
      .limit(limit);
  }

  // Finalizar aposta
  async finalizeBet(betId, payout, win = false) {
    return await this.update(betId, {
      payout: payout,
      win: win
    });
  }

  // Estatísticas do usuário
  async getUserStats(userId) {
    const stats = await this.db(this.tableName)
      .where('user_id', userId)
      .select([
        this.db.raw('COUNT(*) as total_bets'),
        this.db.raw('SUM(amount) as total_wagered'),
        this.db.raw('SUM(payout) as total_won'),
        this.db.raw('COUNT(CASE WHEN win = true THEN 1 END) as wins'),
        this.db.raw('COUNT(CASE WHEN win = false THEN 1 END) as losses')
      ]);

    return stats[0];
  }
}

module.exports = Bet;