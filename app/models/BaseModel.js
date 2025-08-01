const db = require('../../database/connection');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  // Buscar todos os registros
  async findAll(columns = '*') {
    return await this.db(this.tableName).select(columns);
  }

  // Buscar por ID
  async findById(id, columns = '*') {
    return await this.db(this.tableName).select(columns).where('id', id).first();
  }

  // Buscar por external_id
  async findByExternalId(externalId, columns = '*') {
    return await this.db(this.tableName).select(columns).where('external_id', externalId).first();
  }

  // Buscar com condições
  async findWhere(conditions, columns = '*') {
    return await this.db(this.tableName).select(columns).where(conditions);
  }

  // Buscar um registro com condições
  async findOneWhere(conditions, columns = '*') {
    return await this.db(this.tableName).select(columns).where(conditions).first();
  }

  // Criar registro
  async create(data) {
    const [id] = await this.db(this.tableName).insert(data);
    return await this.findById(id);
  }

  // Atualizar registro
  async update(id, data) {
    await this.db(this.tableName).where('id', id).update({
      ...data,
      updated_at: new Date()
    });
    return await this.findById(id);
  }

  // Deletar registro
  async delete(id) {
    return await this.db(this.tableName).where('id', id).del();
  }

  // Contar registros
  async count(conditions = {}) {
    const result = await this.db(this.tableName).where(conditions).count('* as count');
    return parseInt(result[0].count);
  }

  // Paginação
  async paginate(page = 1, limit = 10, conditions = {}) {
    const offset = (page - 1) * limit;
    const data = await this.db(this.tableName)
      .where(conditions)
      .limit(limit)
      .offset(offset);
    
    const total = await this.count(conditions);
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = BaseModel;