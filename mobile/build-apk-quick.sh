#!/bin/bash
# Quick APK build script - Uses EAS (Cloud)
set -e

echo "🚀 GRAFA - Building APK..."
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi

# Install EAS if not present
if ! command -v eas &> /dev/null; then
  echo "📥 Installing EAS CLI..."
  npm install -g eas-cli
fi

# Check if logged in
echo "🔐 Checking Expo credentials..."
eas login || echo "⚠️  Please login to Expo account"

# Build APK
echo ""
echo "🏗️  Building APK (this takes 2-5 minutes)..."
echo ""

eas build --platform android --type apk

echo ""
echo "✅ Build complete!"
echo "📥 Download link provided above"
