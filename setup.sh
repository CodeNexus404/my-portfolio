#!/bin/bash

# Project Setup Script
# Project: Immersive Portfolio
# This script will set up your local development environment

set -e  # Exit on error

echo '🚀 Starting project setup...'

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo '❌ Error: Node.js is not installed.'
    echo 'Please install Node.js from https://nodejs.org/'
    exit 1
fi
echo '✅ Node.js is installed'

# Install dependencies
echo 'Installing dependencies...'
npm install
echo '✅ Dependencies installed'

# Setup Convex
echo 'Setting up Convex...'
if [ ! -f .env.local ]; then
    echo '⚠️  Warning: .env.local file not found.'
    echo 'Copy .env.example to .env.local and fill in your values.'
fi

# Initialize Convex (if not already initialized)
if [ ! -d 'convex/_generated' ]; then
    echo 'Initializing Convex...'
    npx convex dev --once
fi
echo '✅ Convex is set up'

echo ''
echo '🎉 Setup complete!'
echo ''
echo 'To start the development server, run:'
echo '  npm run dev'
echo ''
echo 'Or run frontend and backend separately:'
echo '  npm run dev        # In one terminal (Vite)'
echo '  npx convex dev     # In another terminal (Convex backend)'
