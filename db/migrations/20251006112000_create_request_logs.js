module.exports.up = async function(knex) {
  await knex.schema.createTable('request_logs', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('scope').notNullable(); // e.g., 'ai'
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_request_logs_user_created
      ON request_logs(user_id, created_at);
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_request_logs_scope
      ON request_logs(scope);
  `);
};

module.exports.down = async function(knex) {
  await knex.schema.dropTable('request_logs');
};


