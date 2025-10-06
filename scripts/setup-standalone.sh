#!/bin/bash

echo "🚀 Setting up standalone build with static files..."

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo "❌ .next directory not found. Please run 'npm run build' first."
    exit 1
fi

# Check if standalone directory exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ .next/standalone directory not found. Please run 'npm run build' first."
    exit 1
fi

# Check if static directory exists
if [ ! -d ".next/static" ]; then
    echo "❌ .next/static directory not found. This is the issue!"
    echo "📁 Available directories in .next:"
    ls -la .next/
    echo ""
    echo "🔧 Try running: npm run build:standalone"
    exit 1
fi

# Create .next directory in standalone if it doesn't exist
if [ ! -d ".next/standalone/.next" ]; then
    echo "📁 Creating .next directory in standalone..."
    mkdir -p .next/standalone/.next
fi

# Copy static files
echo "📋 Copying static files to standalone build..."
cp -r .next/static .next/standalone/.next/

# Verify the copy
if [ -d ".next/standalone/.next/static" ]; then
    echo "✅ Static files copied successfully!"
    echo "📁 Static files in standalone:"
    ls -la .next/standalone/.next/static/
else
    echo "❌ Failed to copy static files"
    exit 1
fi

echo "🎉 Standalone build setup complete!"
echo "🚀 You can now start your server with:"
echo "   cd .next/standalone && node server.js"
