// db/migrations/20250123000000_simplify_frameworks.js
module.exports.up = async function up(knex) {
  // Ensure FK enforcement in SQLite
  await knex.raw('PRAGMA foreign_keys = ON');

  // Step 1: Add concepts column to frameworks
  await knex.schema.alterTable('frameworks', (t) => {
    t.text('concepts').nullable(); // JSON array of concept names
  });

  // Step 2: Migrate existing mental model relationships to concepts
  // Get all framework-model relationships
  const frameworkModels = await knex('framework_models')
    .join('mental_models', 'framework_models.model_id', 'mental_models.id')
    .select('framework_models.framework_id', 'mental_models.name as concept_name');

  // Group concepts by framework
  const frameworkConcepts = {};
  for (const fm of frameworkModels) {
    if (!frameworkConcepts[fm.framework_id]) {
      frameworkConcepts[fm.framework_id] = [];
    }
    frameworkConcepts[fm.framework_id].push(fm.concept_name);
  }

  // Update frameworks with concepts
  for (const [frameworkId, concepts] of Object.entries(frameworkConcepts)) {
    await knex('frameworks')
      .where('id', frameworkId)
      .update({ concepts: JSON.stringify(concepts) });
  }

  // Step 3: Update ideas table to reference frameworks instead of mental_models
  await knex.schema.alterTable('ideas', (t) => {
    t.integer('framework_id').unsigned().nullable()
      .references('id').inTable('frameworks').onDelete('SET NULL');
  });

  // Migrate existing idea-model relationships to framework relationships
  // Get ideas that reference mental models
  const ideasWithModels = await knex('ideas')
    .join('framework_models', 'ideas.model_id', 'framework_models.model_id')
    .select('ideas.id', 'framework_models.framework_id');

  // Update ideas to reference frameworks
  for (const idea of ideasWithModels) {
    await knex('ideas')
      .where('id', idea.id)
      .update({ framework_id: idea.framework_id });
  }

  // Step 4: Drop the old relationships and tables
  await knex.schema.dropTableIfExists('framework_models');
  await knex.schema.dropTableIfExists('mental_models');
  
  // Step 5: Remove the old model_id column from ideas
  await knex.schema.alterTable('ideas', (t) => {
    t.dropColumn('model_id');
  });

  // Step 6: Add index for framework_id on ideas
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_ideas_framework_id
      ON ideas(framework_id);
  `);
}

module.exports.down = async function down(knex) {
  // Recreate mental_models table
  await knex.schema.createTable('mental_models', (t) => {
    t.increments('id').primary();
    t.integer('user_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description').notNullable();
    t.string('category').nullable();
    t.boolean('is_system').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  // Recreate framework_models table
  await knex.schema.createTable('framework_models', (t) => {
    t.integer('framework_id').unsigned().notNullable()
      .references('id').inTable('frameworks').onDelete('CASCADE');
    t.integer('model_id').unsigned().notNullable()
      .references('id').inTable('mental_models').onDelete('CASCADE');
    t.string('role').nullable();
    t.primary(['framework_id', 'model_id']);
  });

  // Add model_id back to ideas
  await knex.schema.alterTable('ideas', (t) => {
    t.integer('model_id').unsigned().nullable()
      .references('id').inTable('mental_models').onDelete('SET NULL');
  });

  // Remove concepts column and framework_id from ideas
  await knex.schema.alterTable('frameworks', (t) => {
    t.dropColumn('concepts');
  });
  
  await knex.schema.alterTable('ideas', (t) => {
    t.dropColumn('framework_id');
  });
}