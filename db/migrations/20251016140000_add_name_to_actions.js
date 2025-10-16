module.exports.up = async function up(knex) {
  // Add optional name column to actions
  await knex.schema.alterTable('actions', (t) => {
    t.string('name').nullable();
  });
};

module.exports.down = async function down(knex) {
  await knex.schema.alterTable('actions', (t) => {
    t.dropColumn('name');
  });
};


