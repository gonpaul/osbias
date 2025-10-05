/**
 * Migration: add is_template and tags to journal_entries
 */

exports.up = async function up(knex) {
  await knex.schema.alterTable('journal_entries', (t) => {
    t.boolean('is_template').notNullable().defaultTo(false);
    t.text('tags').nullable(); // store JSON array of strings
  });

  // Optional indexes to speed up template queries
  try {
    await knex.raw(`CREATE INDEX IF NOT EXISTS idx_journal_is_template ON journal_entries(is_template)`);
  } catch {}
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('journal_entries', (t) => {
    t.dropColumn('is_template');
    t.dropColumn('tags');
  });
  try {
    await knex.raw(`DROP INDEX IF EXISTS idx_journal_is_template`);
  } catch {}
};


