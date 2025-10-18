#!/bin/sh

echo "Starting Celery worker..."

# Wait for Redis
echo "Waiting for Redis..."
until redis-cli -h redis ping; do
  echo "Redis not ready, retrying..."
  sleep 2
done

# Wait for DB
echo "Waiting for database..."
ATTEMPTS=0
until python -c "
import os
import sys
from sqlalchemy import create_engine, text

url=os.getenv('DATABASE_URL')
try:
    e=create_engine(url, future=True)
    with e.connect() as conn:
        conn.execute(text('SELECT 1'))
    sys.exit(0)
except Exception as e:
    sys.exit(1)
"; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ "$ATTEMPTS" -gt 30 ]; then
    echo "Database not ready after 30 attempts"
    exit 1
  fi
  echo "DB not ready, retrying... ($ATTEMPTS)"
  sleep 2
done

echo "Starting Celery worker with solo pool..."
exec celery -A app.celery_app worker -l info --pool=solo
