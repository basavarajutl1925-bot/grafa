#!/bin/bash

# GRAFA APK Build Script
# This script helps build the APK using different methods

set -e

echo "🚀 GRAFA Mobile App - APK Build Script"
echo "========================================"
echo ""

# Check prerequisites
check_prerequisites() {
  echo "📋 Checking prerequisites..."
  
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js v14+."
    exit 1
  fi
  
  if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed. Please install npm."
    exit 1
  fi
  
  echo "✅ Node.js and npm found"
  echo "   Node: $(node --version)"
  echo "   npm: $(npm --version)"
  echo ""
}

# Method 1: EAS Build (Cloud-based, recommended)
build_with_eas() {
  echo "🌐 Building with EAS (Cloud)"
  echo "=============================="
  echo ""
  
  if ! command -v eas &> /dev/null; then
    echo "📥 Installing EAS CLI..."
    npm install -g eas-cli
  fi
  
  echo "📝 Step 1: Authenticate with Expo"
  echo "   Go to https://expo.dev and create account if needed"
  eas login
  
  echo ""
  echo "🏗️  Step 2: Building APK (this may take 2-5 minutes)..."
  eas build --platform android --type apk
  
  echo ""
  echo "✅ APK Build complete!"
  echo "📥 Download link will be provided above"
}

# Method 2: Local Gradle Build
build_with_gradle() {
  echo "🔨 Building with Gradle (Local)"
  echo "================================"
  echo ""
  
  if [ ! -d "android" ]; then
    echo "❌ Android folder not found. Please run: npx expo prebuild"
    exit 1
  fi
  
  if ! command -v gradle &> /dev/null && ! command -v ./gradlew &> /dev/null; then
    echo "⚠️  Gradle not found. Creating gradle wrapper..."
    cd android
    gradle wrapper
    cd ..
  fi
  
  echo "🏗️  Building release APK..."
  cd android
  ./gradlew assembleRelease
  cd ..
  
  echo ""
  echo "✅ APK Build complete!"
  echo "📦 APK Location: android/app/build/outputs/apk/release/app-release.apk"
}

# Method 3: Development APK with Expo
build_development_apk() {
  echo "🚧 Building Development APK (Expo)"
  echo "===================================="
  echo ""
  
  if ! command -v eas &> /dev/null; then
    npm install -g eas-cli
  fi
  
  echo "eas login"
  eas build --platform android --type apk --profile preview
  
  echo ""
  echo "✅ Development APK ready!"
}

# Menu
show_menu() {
  echo ""
  echo "📱 Choose Build Method:"
  echo "1️⃣  EAS Build (Cloud, Easiest, Recommended)"
  echo "2️⃣  Gradle Build (Local, Requires Android SDK)"
  echo "3️⃣  Development APK (For testing)"
  echo "4️⃣  Exit"
  echo ""
}

# Main
main() {
  check_prerequisites
  
  while true; do
    show_menu
    read -p "Choose option (1-4): " choice
    
    case $choice in
      1)
        build_with_eas
        break
        ;;
      2)
        build_with_gradle
        break
        ;;
      3)
        build_development_apk
        break
        ;;
      4)
        echo "👋 Goodbye!"
        exit 0
        ;;
      *)
        echo "❌ Invalid option. Please choose 1-4."
        ;;
    esac
  done
}

main
