// knexfile.js
export default {
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
  }
};
