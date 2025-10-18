#!/bin/sh

echo "Starting Celery worker..."

# Wait for Redis
echo "Waiting for Redis..."
until redis-cli -h redis ping; do
  echo "Redis not ready, retrying..."
  sleep 2
done

echo "Starting Celery worker with solo pool..."
exec celery -A app.celery_app worker -l info --pool=solo