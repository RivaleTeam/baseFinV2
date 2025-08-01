exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.bigInteger('user_id').unsigned().notNullable();
    table.enum('type', ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'referral', 'adjustment']).notNullable();
    table.decimal('amount', 18, 8).notNullable();
    table.decimal('balance_before', 18, 8);
    table.decimal('balance_after', 18, 8);
    table.json('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};