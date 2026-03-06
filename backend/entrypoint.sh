#!/bin/bash
set -e

# Auto-generate SECRET_KEY if not explicitly set or left as placeholder
if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "change-me-in-production" ]; then
    export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
    echo "Generated SECRET_KEY automatically."
fi

echo "Running database migrations..."
flask db upgrade

echo "Starting server..."
exec gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5000 "app:create_app()"
