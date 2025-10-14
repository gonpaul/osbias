module.exports.up = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.boolean('is_test_user').notNullable().defaultTo(false);
    t.integer('rate_limit_quota').nullable();
    t.boolean('exempt_from_rate_limit').notNullable().defaultTo(false);
    t.string('plan').nullable(); // e.g., 'free', 'pro'
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_is_test_user
      ON users(is_test_user);
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_plan
      ON users(plan);
  `);
};

module.exports.down = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('is_test_user');
    t.dropColumn('rate_limit_quota');
    t.dropColumn('exempt_from_rate_limit');
    t.dropColumn('plan');
  });
};


