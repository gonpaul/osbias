const bcrypt = require("bcryptjs");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const email = 'admin@osbias.local';
  const exists = await knex('users').where({ email }).first();
  if (exists) return;

  const password_hash = await bcrypt.hash('Admin1234!', 10);
  await knex('users').insert({
    name: 'Admin',
    email,
    password_hash,
    role: 'admin',
    preferences: null,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
};
