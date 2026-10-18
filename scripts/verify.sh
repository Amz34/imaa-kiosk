#!/usr/bin/env bash
# Canonical verification entrypoint for Imaa.
#   make verify   -> backend unit tests + frontend typecheck + production build
# Fails on the first broken stage; exit code is the contract.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== backend: unit suite =="
( cd backend && PYTHONPATH=. .venv/bin/python -m pytest tests/ -q )

echo "== frontend: typecheck =="
( cd frontend && ./node_modules/.bin/tsc -p tsconfig.json --noEmit )

echo "== frontend: production build =="
( cd frontend && ./node_modules/.bin/next build >/dev/null && echo "build ok" )

echo "ALL GREEN"
