#!/bin/bash

# Kill any existing Python HTTP servers
pkill -f "python3 -m http.server" || true

# Kill any existing http-server instances
pkill -f "http-server" || true

# Start Python HTTP server
echo "Starting Aether Enterprise website server on http://localhost:3001"
python3 -m http.server 3001
