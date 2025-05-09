#!/bin/bash

# Run script for Legal CRM Frontend

echo "Starting Legal CRM Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm 8.x or higher."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Dependencies not found. Running setup script..."
    bash setup.sh
fi

# Start the development server
echo "Starting development server..."
npm run dev