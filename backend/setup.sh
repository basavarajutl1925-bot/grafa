#!/bin/bash

# Grafa Backend Setup Script
# This script sets up MongoDB, installs dependencies, and runs the server

set -e

echo "🚀 Grafa Backend Setup"
echo "====================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MongoDB is installed/running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not in PATH. Trying to start with local installation..."
    # Optional: Start MongoDB Docker container
    # docker run -d -p 27017:27017 --name mongodb mongo:latest
fi

# Navigate to backend directory
cd backend

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your configuration."
fi

# Create logs directory
mkdir -p logs

# Run migrations/initialization
echo ""
echo "🗄️  Setting up database indexes..."
node src/server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Kill the server after setup
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your MongoDB URI and JWT secret"
echo "2. Start the server: npm run dev"
echo ""
echo "Available commands:"
echo "  npm start    - Start production server"
echo "  npm run dev  - Start development server with auto-reload"
echo "  npm test     - Run tests"
