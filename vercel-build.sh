#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Set Node options for better memory management
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --no-audit --no-fund --prefer-offline

# Build the project
echo "🏗️ Building project..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build successful! Output directory: dist"
    ls -la dist/
else
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "🎉 Build completed successfully!"