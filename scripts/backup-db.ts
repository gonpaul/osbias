import fs from 'fs';
import path from 'path';

function main() {
  const projectRoot = __dirname ? path.resolve(__dirname, '..') : process.cwd();
  const src = path.resolve(projectRoot, 'dev.sqlite3');
  const backupsDir = path.resolve(projectRoot, 'backups');
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const dst = path.resolve(backupsDir, `dev.sqlite3.bak.${ts}`);

  if (!fs.existsSync(src)) {
    console.error('Source DB not found:', src);
    process.exit(1);
  }
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  fs.copyFileSync(src, dst);
  console.log('Backup created:', dst);

  // Keep only the latest backup file; remove older ones
  try {
    const prefix = 'dev.sqlite3.bak.';
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith(prefix))
      .map(f => ({
        name: f,
        path: path.resolve(backupsDir, f),
        mtimeMs: fs.statSync(path.resolve(backupsDir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    // Keep the first (most recent), delete the rest
    for (let i = 1; i < files.length; i++) {
      try {
        fs.unlinkSync(files[i].path);
        console.log('Deleted old backup:', files[i].name);
      } catch (e) {
        console.warn('Failed to delete old backup:', files[i].name, e);
      }
    }
  } catch (e) {
    console.warn('Backup rotation skipped:', e);
  }
}

main();


