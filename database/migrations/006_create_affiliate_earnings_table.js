exports.up = function(knex) {
  return knex.schema.createTable('affiliate_earnings', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.bigInteger('affiliate_id').unsigned().notNullable();
    table.bigInteger('referred_user_id').unsigned().notNullable();
    table.bigInteger('bet_id').unsigned().notNullable();
    table.decimal('earned_amount', 18, 8).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('affiliate_id').references('user_id').inTable('affiliates').onDelete('CASCADE');
    table.foreign('referred_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('bet_id').references('id').inTable('bets').onDelete('CASCADE');
    table.index(['affiliate_id', 'referred_user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliate_earnings');
};