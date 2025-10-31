import knex from "knex";
import path from "path";
import fs from "fs";

const defaultName = process.env.NODE_ENV === 'production' ? 'db.sqlite3' : 'dev.sqlite3';
const dbPath = process.env.DB_PATH || path.join(process.cwd(), defaultName);

if (process.env.DB_PATH) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbDir, { recursive: true });
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
