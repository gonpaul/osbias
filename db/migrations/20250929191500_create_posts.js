module.exports.up = async function(knex) {
  await knex.raw('PRAGMA foreign_keys = ON');

  await knex.schema.createTable('posts', (t) => {
    t.increments('id').primary();
    t
      .integer('author_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t
      .integer('entry_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('journal_entries')
      .onDelete('SET NULL');
    t.string('title').notNullable();
    t.text('content').notNullable(); // markdown snapshot
    t
      .enu('visibility', ['public', 'unlisted', 'private'], {
        useNative: true,
        enumName: 'post_visibility'
      })
      .notNullable()
      .defaultTo('public');
    t.string('slug').notNullable().unique();
    t.timestamps(true, true);

    t.index(['visibility', 'created_at']);
    t.index(['author_id', 'created_at']);
  });
};

module.exports.down = async function(knex) {
  // Drop table and enum if exists
  await knex.schema.dropTableIfExists('posts');
};


