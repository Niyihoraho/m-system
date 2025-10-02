#!/bin/bash

# Deployment script for EC2 instance
echo "🚀 Starting deployment process..."

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the application with error handling
echo "🔨 Building the application..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment."
else
    echo "❌ Build failed. Check the logs above."
    exit 1
fi

echo "🎉 Deployment preparation complete!"
