#!/bin/bash
set -e

# Auto-generate SECRET_KEY if not explicitly set or left as placeholder
if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "change-me-in-production" ]; then
    export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
    echo "Generated SECRET_KEY automatically."
fi

# Auto-generate ADMIN_PASSWORD if not set
if [ -z "$ADMIN_PASSWORD" ]; then
    export ADMIN_PASSWORD=$(python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(24)).decode())")
    echo "============================================"
    echo "  ADMIN_PASSWORD: $ADMIN_PASSWORD"
    echo "  Save this to your .env for persistence!"
    echo "============================================"
fi

echo "Running database migrations..."
flask db upgrade

echo "Starting server..."
exec gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:5000 "app:create_app()"
