import knex from "knex";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'dev.sqlite3');
const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: path.resolve(dbPath),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(process.cwd(), "db/migrations"),
  },
  seeds: {
    directory: path.resolve(process.cwd(), "db/seeds"),
  },
});
export default db;
