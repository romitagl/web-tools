# Variables
PROJECT_NAME = web-tools
NODE_VERSION=23

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  run      - Start development server"
	@echo "  build      - Build production application"
	@echo "  clean      - Remove build artifacts and dependencies"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run development server with hot-reload"

# Local development targets
.PHONY: install
install:
	npm install -g npm@latest
	npm ci --legacy-peer-deps

.PHONY: run
start:
	npm run dev

.PHONY: build
build:
	npm run build --verbose

# Cleanup
.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf build
	docker rmi $(PROJECT_NAME) || true

# Docker install & build
.PHONY: docker-build
docker-build:
	docker build --no-cache --build-arg NODE_VERSION=$(NODE_VERSION) --target builder -t $(PROJECT_NAME) -f ./Dockerfile .

# Run development server with hot-reload
.PHONY: docker-run
docker-run:
	docker run -it --rm -p 3000:3000 -v $(PWD):/app -w /app $(PROJECT_NAME) npm run dev -- --host --open=false

# Run node command in Docker container
# make docker-run-node-cmd CMD="npm install vite"
.PHONY: docker-run-node-cmd
docker-run-node-cmd:
	# init app
	# make docker-run-node-cmd CMD="npm create vite@latest web-tools -- --template react"
	docker run -it --rm -v $(PWD):/app -w /app node:$(NODE_VERSION) $(CMD)
