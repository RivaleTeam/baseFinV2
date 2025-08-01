const Joi = require('joi');

const createBetSchema = Joi.object({
  game_id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID do jogo deve ser um número',
    'number.integer': 'ID do jogo deve ser um número inteiro',
    'number.positive': 'ID do jogo deve ser positivo',
    'any.required': 'ID do jogo é obrigatório'
  }),
  amount: Joi.number().positive().precision(8).required().messages({
    'number.base': 'Valor da aposta deve ser um número',
    'number.positive': 'Valor da aposta deve ser positivo',
    'any.required': 'Valor da aposta é obrigatório'
  }),
  metadata: Joi.object().optional()
});

module.exports = {
  createBetSchema
};