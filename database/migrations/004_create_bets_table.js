exports.up = function(knex) {
  return knex.schema.createTable('bets', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.bigInteger('user_id').unsigned().notNullable();
    table.bigInteger('game_id').unsigned().notNullable();
    table.decimal('amount', 18, 8).notNullable();
    table.decimal('payout', 18, 8).defaultTo(0);
    table.boolean('win').defaultTo(false);
    table.json('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('game_id').references('id').inTable('games').onDelete('CASCADE');
    table.index(['user_id', 'game_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bets');
};