/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.up = async function(knex) {
  // Create framework_usage table to track when users apply frameworks
  await knex.schema.createTable('framework_usage', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t
      .integer('framework_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t
      .integer('entry_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('journal_entries')
      .onDelete('SET NULL');
    t.timestamp('used_at').notNullable().defaultTo(knex.fn.now());
    t.text('notes').nullable(); // Optional user notes about the usage
    t.boolean('completed').defaultTo(false); // Whether the framework was fully applied
    t.timestamps(true, true);

    // Indexes for performance
    t.index(['user_id', 'framework_id']);
    t.index(['user_id', 'used_at']);
    t.index(['framework_id', 'used_at']);
  });

  // Create framework_effectiveness table to track user ratings
  await knex.schema.createTable('framework_effectiveness', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t
      .integer('framework_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t.integer('rating').notNullable(); // 1-5 scale
    t.text('feedback').nullable(); // User feedback about the framework
    t.timestamp('rated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamps(true, true);

    // Unique constraint to prevent duplicate ratings
    t.unique(['user_id', 'framework_id']);
    t.index(['framework_id', 'rating']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('framework_effectiveness');
  await knex.schema.dropTable('framework_usage');
};
