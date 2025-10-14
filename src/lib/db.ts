import knex from "knex";
import path from "path";

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: path.resolve(process.cwd(), "dev.sqlite3"),
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
