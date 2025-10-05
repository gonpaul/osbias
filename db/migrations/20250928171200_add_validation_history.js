module.exports.up = async function(knex) {
  // Ensure FK enforcement in SQLite
  await knex.raw('PRAGMA foreign_keys = ON');

  // Create validation_history table
  await knex.schema.createTable('validation_history', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t
      .integer('journal_entry_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('journal_entries')
      .onDelete('SET NULL');
    t.text('original_text').notNullable();
    t.text('validation_result').notNullable(); // JSON string of ValidationResult
    t.text('ai_provider').nullable(); // Store which AI provider was used
    t.text('ai_model').nullable(); // Store which AI model was used
    t.integer('text_start').nullable(); // Start position of selected text
    t.integer('text_end').nullable(); // End position of selected text
    t.boolean('is_full_document').defaultTo(false); // Whether entire document was validated
    t.timestamps(true, true);
  });

  // Create indexes for efficient querying
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_validation_history_user_id
      ON validation_history(user_id);
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_validation_history_created_at
      ON validation_history(created_at DESC);
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_validation_history_journal_entry
      ON validation_history(journal_entry_id);
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_validation_history_user_created
      ON validation_history(user_id, created_at DESC);
  `);
};

module.exports.down = async function(knex) {
  await knex.schema.dropTable('validation_history');
};
