#!/bin/bash

# ==============================================
# Projektor - Build and Run Script
# ==============================================

set -e  # Exit on any error

echo "🚀 Projektor - Build & Run Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Parse arguments
MODE="${1:-dev}"

case "$MODE" in
    "dev")
        echo -e "${GREEN}🔧 Starting development server...${NC}"
        npm run dev
        ;;
    "build")
        echo -e "${GREEN}🏗️  Building for production...${NC}"
        npm run build
        echo -e "${GREEN}✅ Build completed successfully!${NC}"
        ;;
    "start")
        echo -e "${GREEN}🏗️  Building for production...${NC}"
        npm run build
        echo -e "${GREEN}🚀 Starting production server...${NC}"
        npm run start
        ;;
    "lint")
        echo -e "${GREEN}🔍 Running linter...${NC}"
        npm run lint
        ;;
    *)
        echo -e "${RED}❌ Unknown mode: $MODE${NC}"
        echo ""
        echo "Usage: ./run.sh [mode]"
        echo ""
        echo "Modes:"
        echo "  dev    - Start development server (default)"
        echo "  build  - Build for production"
        echo "  start  - Build and start production server"
        echo "  lint   - Run linter"
        exit 1
        ;;
esac
