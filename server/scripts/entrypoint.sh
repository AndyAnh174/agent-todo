#!/bin/sh

# Wait for DB
if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."
  # naive wait loop
  ATTEMPTS=0
  until python - <<'PY'
import os
import sys
import time
from sqlalchemy import create_engine, text

url=os.getenv('DATABASE_URL')
try:
    e=create_engine(url, future=True)
    with e.connect() as conn:
        conn.execute(text("SELECT 1"))
    sys.exit(0)
except Exception as e:
    sys.exit(1)
PY
  do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ "$ATTEMPTS" -gt 30 ]; then
      echo "Database not ready after 30 attempts"
      exit 1
    fi
    echo "DB not ready, retrying... ($ATTEMPTS)"
    sleep 2
  done
fi

# Run migrations
alembic upgrade head

# Start server
exec uvicorn server.app.main:app --host 0.0.0.0 --port ${APP_PORT:-8000}


