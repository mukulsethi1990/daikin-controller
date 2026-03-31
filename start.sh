#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting Daikin Controller..."
open "http://100.113.231.86:8484"
node "$DIR/server.js"
