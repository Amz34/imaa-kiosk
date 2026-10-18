.PHONY: verify test backend frontend lint fmt clean smoke

verify:
	@bash scripts/verify.sh

test: verify

backend:
	cd backend && PYTHONPATH=. .venv/bin/python -m pytest tests/ -q

frontend:
	cd frontend && ./node_modules/.bin/tsc -p tsconfig.json --noEmit

fmt:
	cd backend && .venv/bin/python -m ruff format app tests

# Lint is a gate, not a suggestion: ruff exits non-zero on findings.
lint:
	cd backend && .venv/bin/python -m ruff check app tests

clean:
	rm -rf frontend/.next backend/.pytest_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +

# Functional UI smoke test on the local static export (headless Chrome + CDP).
smoke:
	@bash scripts/smoke.sh
