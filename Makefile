.PHONY: dev backend frontend install-backend install-frontend clean

dev:
	@echo "Starting backend and frontend..."
	@trap 'kill 0' INT TERM EXIT; \
	( cd backend && uv venv && . .venv/bin/activate && uv pip install -e . && uvicorn src.main:app --reload --port 8000 ) & \
	( cd frontend && npm install && npm run dev ) & \
	wait

backend:
	@cd backend && uv venv && . .venv/bin/activate && uv pip install -e . && uvicorn src.main:app --reload --port 8000

frontend:
	@cd frontend && npm install && npm run dev

install-backend:
	@cd backend && uv venv && . .venv/bin/activate && uv pip install -e .

install-frontend:
	@cd frontend && npm install

clean:
	@rm -rf __pycache__ backend/__pycache__ frontend/dist backend/data/cache.json
