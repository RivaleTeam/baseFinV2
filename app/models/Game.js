const BaseModel = require('./BaseModel');
const { generateExternalId } = require('../utils/generateId');

class Game extends BaseModel {
  constructor() {
    super('games');
  }

  async create(data) {
    const gameData = {
      ...data,
      external_id: generateExternalId('GAME', 12),
      active: true
    };

    return await super.create(gameData);
  }

  // Buscar jogos ativos
  async findActive() {
    return await this.findWhere({ active: true });
  }

  // Buscar jogos por tipo
  async findByType(type) {
    return await this.findWhere({ type, active: true });
  }

  // Desativar jogo
  async deactivate(id) {
    return await this.update(id, { active: false });
  }

  // Ativar jogo
  async activate(id) {
    return await this.update(id, { active: true });
  }
}

module.exports = Game;