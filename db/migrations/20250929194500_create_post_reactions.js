module.exports.up = async function(knex) {
  await knex.schema.createTable('post_reactions', (t) => {
    t.increments('id').primary();
    t.integer('post_id').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE');
    t.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.enu('reaction', ['like', 'dislike'], { useNative: true, enumName: 'post_reaction_type' }).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['post_id', 'user_id']);
    t.index(['post_id', 'reaction']);
  });
};

module.exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('post_reactions');
};


