/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.text('openrouter_api_key').nullable().after('anthropic_api_key');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('openrouter_api_key');
  });
};
