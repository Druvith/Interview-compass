.PHONY: dev backend frontend install clean

# Setup target: Run this once or when dependencies change
install:
	@echo "Installing backend and frontend dependencies..."
	@cd backend && uv venv && . .venv/bin/activate && uv pip install -e .
	@cd frontend && npm install

# Dev target: Optimized for speed and reliable process cleanup
dev:
	@echo "Starting Interview Compass (The Obsidian Lens)..."
	@# trap 'kill 0' ensures that when the Makefile process receives SIGINT (Ctrl+C), 
	@# it sends the signal to all processes in the current process group.
	@trap 'kill 0' INT TERM EXIT; \
	( cd backend && . .venv/bin/activate && uvicorn src.main:app --reload --port 8000 ) & \
	( cd frontend && npm run dev ) & \
	wait

backend:
	@cd backend && . .venv/bin/activate && uvicorn src.main:app --reload --port 8000

frontend:
	@cd frontend && npm run dev

clean:
	@echo "Cleaning up build artifacts and cache..."
	@rm -rf backend/__pycache__ frontend/dist backend/data/cache.json
	@find . -type d -name "__pycache__" -exec rm -rf {} +