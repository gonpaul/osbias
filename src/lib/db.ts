import knex from "knex";
import path from "path";
import fs from "fs";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'dev.sqlite3');

if (process.env.DB_PATH) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
}

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
