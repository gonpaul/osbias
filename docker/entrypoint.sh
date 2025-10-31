#!/usr/bin/env sh
set -eu
set -x  # Enable debug output

: "${DB_PATH:=/app/data/db.sqlite3}"
export DB_PATH

echo "=== Entrypoint starting ==="
echo "Using DB_PATH=$DB_PATH"
mkdir -p "$(dirname "$DB_PATH")"

echo "=== Running migrations ==="
npx knex migrate:latest || {
  echo "Migration failed, exiting"
  exit 1
}
echo "=== Migrations complete ==="

# Seed only once using a marker on the mounted volume
SEED_MARKER_DIR="/app/data"
SEED_MARKER_FILE="$SEED_MARKER_DIR/.seeded"
mkdir -p "$SEED_MARKER_DIR"
if [ ! -f "$SEED_MARKER_FILE" ]; then
  echo "=== Running seeds ==="
  npx knex seed:run || {
    echo "Seeds failed (continuing anyway)"
  }
  touch "$SEED_MARKER_FILE"
  echo "=== Seeds complete ==="
else
  echo "Seeds already applied; skipping."
fi

echo "=== Starting application ==="
# Hand off to CMD
exec "$@"


