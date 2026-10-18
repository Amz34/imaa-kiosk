#!/usr/bin/env bash
# Functional smoke test against the built static export (no deploy needed).
# Serves frontend/out on a throwaway port, drives headless Chrome over CDP, and
# asserts real interaction: text scale, contrast, sign selection, tap targets.
set -u
PORT="${SMOKE_PORT:-3999}"
CDP="${SMOKE_CDP_PORT:-9223}"
cd "$(dirname "$0")/.." || exit 1

[ -d frontend/out ] || { echo "frontend/out missing - run: make verify"; exit 1; }

python3 -m http.server "$PORT" -d frontend/out >/tmp/imaa-smoke-http.log 2>&1 &
HTTP_PID=$!
chrome_pid=""
cleanup() {
  [ -n "$chrome_pid" ] & kill "$chrome_pid" 2>/dev/null
  kill "$HTTP_PID" 2>/dev/null
}
trap cleanup EXIT

for _ in $(seq 1 20); do
  curl -sf -o /dev/null "http://127.0.0.1:$PORT/" && break
  sleep 0.3
done

google-chrome --headless --disable-gpu --no-sandbox \
  --remote-debugging-port="$CDP" --window-size=390,1500 \
  "http://127.0.0.1:$PORT/" >/tmp/imaa-smoke-chrome.log 2>&1 &
chrome_pid=$!

for _ in $(seq 1 40); do
  curl -sf -o /dev/null "http://127.0.0.1:$CDP/json/version" && break
  sleep 0.3
done

node scripts/smoke_kiosk.mjs "http://127.0.0.1:$PORT/" "http://127.0.0.1:$CDP"
