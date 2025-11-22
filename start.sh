#!/bin/bash

# Get Replit domain
REPLIT_DOMAIN=$(echo $REPLIT_DOMAINS | cut -d',' -f1)
if [ -z "$REPLIT_DOMAIN" ]; then
  REPLIT_DOMAIN="localhost"
fi

# Create backend .env if it doesn't exist
if [ ! -f impressa/impressa-backend/.env ]; then
  echo "Creating backend .env from environment variables..."
  cat > impressa/impressa-backend/.env << EOF
NODE_ENV=${NODE_ENV:-development}
PORT=8000
MONGO_URI=${MONGO_URI}
JWT_SECRET=${JWT_SECRET}
REFRESH_SECRET=${REFRESH_SECRET}
FRONTEND_URL=https://${REPLIT_DOMAIN}

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
ADMIN_EMAIL=${EMAIL_USER}

COHERE_API_KEY=${COHERE_API_KEY}

MTN_API_USER=${MTN_API_USER}
MTN_API_KEY=${MTN_API_KEY}
MTN_SUBSCRIPTION_KEY=${MTN_SUBSCRIPTION_KEY}
MTN_ENVIRONMENT=${MTN_ENVIRONMENT:-sandbox}
MTN_CALLBACK_URL=https://${REPLIT_DOMAIN}/api/payments/mtn/callback
EOF
fi

# Create frontend .env if it doesn't exist
if [ ! -f impressa/impressa-frontend/.env ]; then
  echo "Creating frontend .env..."
  cat > impressa/impressa-frontend/.env << EOF
PORT=5000
REACT_APP_API_URL=/api
WDS_SOCKET_PORT=0
DANGEROUSLY_DISABLE_HOST_CHECK=true
EOF
fi

# Start the backend server in the background
cd impressa/impressa-backend
echo "Starting backend server on port 8000..."
npm start &
BACKEND_PID=$!

# Start the frontend
cd ../impressa-frontend
echo "Starting frontend on port 5000..."
HOST=0.0.0.0 npm start

# If frontend exits, kill backend
kill $BACKEND_PID 2>/dev/null
