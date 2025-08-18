#!/bin/bash

# KEDB Draft Generator - Quick Start Script
echo "🚀 KEDB Draft Generator - Local Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend-separate
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend-separate
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 To start the application:"
echo ""
echo "Terminal 1 (Backend - Port 8000):"
echo "  cd backend-separate"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend - Port 3000):"
echo "  cd frontend-separate"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Happy coding! 🎉"