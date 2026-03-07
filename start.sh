#!/bin/bash
# PixelTrade - Server Start Script
# Run this from the project root: bash start.sh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="/Users/mrchartist/.nvm/versions/node/v20.20.0/bin/node"
MODULES_DIR="/tmp/chartsnap-server-run/node_modules"

echo ""
echo "🚀 Starting PixelTrade..."
echo "   Project: $PROJECT_DIR"
echo "   Node:    $NODE_BIN"
echo "   Modules: $MODULES_DIR"
echo ""

# Check node binary exists
if [ ! -f "$NODE_BIN" ]; then
    echo "❌ Node not found at $NODE_BIN"
    echo "   Try: source ~/.nvm/nvm.sh && nvm use 20"
    exit 1
fi

# Check node_modules exist
if [ ! -d "$MODULES_DIR" ]; then
    echo "❌ node_modules not found at $MODULES_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
NODE_PATH="$MODULES_DIR" "$NODE_BIN" server/index.js
