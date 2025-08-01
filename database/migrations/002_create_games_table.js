exports.up = function(knex) {
  return knex.schema.createTable('games', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.string('name', 100).notNullable();
    table.enum('type', ['scratch', 'roulette', 'slots', 'custom']).defaultTo('custom');
    table.json('metadata');
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('games');
};