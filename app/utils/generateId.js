const crypto = require('crypto');

/**
 * Gera um ID externo único
 * @param {string} prefix - Prefixo do ID (ex: 'USR', 'TRX', 'BET')
 * @param {number} length - Tamanho do ID (padrão: 10)
 * @returns {string} ID único
 */
function generateExternalId(prefix = '', length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length - prefix.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

module.exports = { generateExternalId };