module.exports.up = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.integer('sponsored_by_user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    t.datetime('sponsorship_expires_at').nullable();
    t.string('openai_api_key').nullable();
    t.string('anthropic_api_key').nullable();
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_sponsored_by
      ON users(sponsored_by_user_id);
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_sponsorship_expires
      ON users(sponsorship_expires_at);
  `);
};

module.exports.down = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('sponsored_by_user_id');
    t.dropColumn('sponsorship_expires_at');
    t.dropColumn('openai_api_key');
    t.dropColumn('anthropic_api_key');
  });
};


