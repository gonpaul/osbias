export async function up(knex) {
  // Ensure FK enforcement in SQLite
  await knex.raw('PRAGMA foreign_keys = ON');

  // Update existing users table to match requirements
  await knex.schema.alterTable('users', (t) => {
    // Add missing fields
    t.string('password_hash').notNullable().defaultTo(''); // placeholder for auth
  });

  // Add unique constraint on email if not already present
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users(email);
  `);

  // mental_models (abstract/general)
  await knex.schema.createTable('mental_models', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description').notNullable();
    t.string('category').nullable();
    t.boolean('is_system').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  // Enforce system item invariants and unique names via partial indexes
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_models_name_system
      ON mental_models(name)
      WHERE user_id IS NULL AND is_system = true;
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_models_name_user
      ON mental_models(name, user_id)
      WHERE user_id IS NOT NULL AND is_system = false;
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_models_category
      ON mental_models(category);
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_models_is_system
      ON mental_models(is_system);
  `);

  // frameworks (concrete/implementations)
  await knex.schema.createTable('frameworks', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description').notNullable();
    t.boolean('is_system').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fw_name_system
      ON frameworks(name)
      WHERE user_id IS NULL AND is_system = true;
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fw_name_user
      ON frameworks(name, user_id)
      WHERE user_id IS NOT NULL AND is_system = false;
  `);
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_fw_is_system
      ON frameworks(is_system);
  `);

  // framework_steps
  await knex.schema.createTable('framework_steps', (t) => {
    t.increments('id').primary();
    t
      .integer('framework_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t.integer('step_order').notNullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.timestamps(true, true);

    t.unique(['framework_id', 'step_order']);
    t.check('step_order >= 1', [], 'chk_fw_steps_order');
  });
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_fw_steps_order
      ON framework_steps(framework_id, step_order);
  `);

  // framework_models (join)
  await knex.schema.createTable('framework_models', (t) => {
    t
      .integer('framework_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t
      .integer('model_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('mental_models')
      .onDelete('CASCADE');
    t.string('role').nullable();

    t.primary(['framework_id', 'model_id']);
    t.check("role IN ('primary','supporting') OR role IS NULL", [], 'chk_fw_models_role');
  });
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_fw_models_model_fw
      ON framework_models(model_id, framework_id);
  `);

  // similar_frameworks (self-referential)
  await knex.schema.createTable('similar_frameworks', (t) => {
    t
      .integer('framework_id_a')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t
      .integer('framework_id_b')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('CASCADE');
    t.text('similarity_note').nullable();
    t.timestamps(true, true);

    t.primary(['framework_id_a', 'framework_id_b']);
    t.check('framework_id_a <> framework_id_b', [], 'chk_sim_fw_distinct');
    t.check('framework_id_a < framework_id_b', [], 'chk_sim_fw_order');
  });
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_sim_fw_ba
      ON similar_frameworks(framework_id_b, framework_id_a);
  `);

  // journal_entries
  await knex.schema.createTable('journal_entries', (t) => {
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
      .nullable()
      .references('id')
      .inTable('frameworks')
      .onDelete('SET NULL');
    t.string('title').notNullable();
    t.text('content').notNullable();
    t.timestamps(true, true);

    t.index(['user_id', 'created_at']);
    t.index(['framework_id']);
  });

  // ideas
  await knex.schema.createTable('ideas', (t) => {
    t.increments('id').primary();
    t
      .integer('entry_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('journal_entries')
      .onDelete('CASCADE');
    t
      .integer('model_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('mental_models')
      .onDelete('SET NULL');
    t.text('content').notNullable();
    t.text('text_selection').nullable();
    t.text('file_path').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index(['entry_id', 'created_at']);
    t.index(['model_id']);
  });

  // beliefs
  await knex.schema.createTable('beliefs', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.text('belief').notNullable();
    t.integer('confidence_level').notNullable();
    t.text('evidence').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index(['user_id', 'created_at']);
    t.check('confidence_level BETWEEN 0 AND 100', [], 'chk_beliefs_conf');
  });

  // goals
  await knex.schema.createTable('goals', (t) => {
    t.increments('id').primary();
    t
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('title').notNullable();
    t.text('description').nullable();
    t.string('status').notNullable();
    t.date('target_date').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index(['user_id', 'status']);
    t.index(['user_id', 'target_date']);
    t.check("status IN ('planned','active','blocked','done','dropped')", [], 'chk_goals_status');
  });

  // actions
  await knex.schema.createTable('actions', (t) => {
    t.increments('id').primary();
    t
      .integer('goal_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('goals')
      .onDelete('CASCADE');
    t.text('description').notNullable();
    t.boolean('completed').notNullable().defaultTo(false);
    t.date('due_date').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index(['goal_id', 'completed', 'due_date']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('actions');
  await knex.schema.dropTableIfExists('goals');
  await knex.schema.dropTableIfExists('beliefs');
  await knex.schema.dropTableIfExists('ideas');
  await knex.schema.dropTableIfExists('journal_entries');
  await knex.schema.dropTableIfExists('similar_frameworks');
  await knex.schema.dropTableIfExists('framework_models');
  await knex.schema.dropTableIfExists('framework_steps');
  await knex.schema.dropTableIfExists('frameworks');
  await knex.schema.dropTableIfExists('mental_models');
  
  // Revert users table changes
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('password_hash');
  });
}