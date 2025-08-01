exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.string('email', 255).unique().notNullable();
    table.string('username', 50).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.decimal('balance', 18, 8).defaultTo(0.0);
    table.decimal('blocked_balance', 18, 8).defaultTo(0.0);
    table.enum('status', ['active', 'blocked', 'frozen']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};