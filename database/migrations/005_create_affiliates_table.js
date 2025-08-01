exports.up = function(knex) {
  return knex.schema.createTable('affiliates', function(table) {
    table.bigIncrements('id').primary();
    table.string('external_id', 20).unique().index();
    table.bigInteger('user_id').unsigned().unique().notNullable();
    table.bigInteger('referred_by').unsigned();
    table.decimal('rev_share_percent', 5, 2).defaultTo(5.00);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('referred_by').references('id').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('affiliates');
};