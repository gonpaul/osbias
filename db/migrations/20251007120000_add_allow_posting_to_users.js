module.exports.up = async function(knex) {
  await knex.raw('PRAGMA foreign_keys = ON');
  const hasColumn = await knex.schema.hasColumn('users', 'allow_posting');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (t) => {
      t.boolean('allow_posting').notNullable().defaultTo(false);
    });
  }
};

module.exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'allow_posting');
  if (hasColumn) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('allow_posting');
    });
  }
};


