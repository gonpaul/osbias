// knexfile.js
module.exports = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    },
    useNullAsDefault: true, // required for sqlite
    migrations: {
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  },
  production: {
    client: "better-sqlite3",
    connection: { filename: process.env.DB_PATH || "./db.sqlite3" },
    useNullAsDefault: true,
    migrations: { directory: "./db/migrations" },
    seeds: { directory: "./db/seeds" }
  }
};
