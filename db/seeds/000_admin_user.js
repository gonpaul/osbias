// const bcrypt = require("bcryptjs");
import bcrypt from 'bcryptjs'
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
    preferences: JSON.stringify({
      aiProvider: 'openrouter',
      aiModel: 'gpt-4o-mini',
      aiMaxTokens: 512
    }),
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
};
