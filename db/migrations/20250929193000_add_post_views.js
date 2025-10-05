module.exports.up = async function(knex) {
  await knex.schema.alterTable('posts', (t) => {
    t.integer('views').notNullable().defaultTo(0);
  });
  // Helpful composite index for ranking by visibility, views desc, created_at desc
  try {
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_posts_vis_views_created ON posts(visibility, views DESC, created_at DESC)`);
  } catch {}
};

module.exports.down = async function(knex) {
  await knex.schema.alterTable('posts', (t) => {
    t.dropColumn('views');
  });
};


