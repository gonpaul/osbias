module.exports.up = async function(knex) {
  await knex.raw('PRAGMA foreign_keys = ON');

  await knex.schema.createTable('chat_sessions', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.text('name').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('chat_messages', (t) => {
    t.increments('id').primary();
    t
      .integer('session_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('chat_sessions')
      .onDelete('CASCADE');
    t.text('role').notNullable(); // 'user' | 'assistant'
    t.text('content').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created
    ON chat_sessions(user_id, created_at DESC);
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
    ON chat_messages(session_id, created_at);
  `);
};

module.exports.down = async function(knex) {
  await knex.schema.dropTable('chat_messages');
  await knex.schema.dropTable('chat_sessions');
};


