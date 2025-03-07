# Variables
PROJECT_NAME = web-tools
NODE_VERSION=20

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo " install - Install dependencies"
	@echo " run - Start development server"
	@echo " build - Build production application"
	@echo " clean - Remove build artifacts and dependencies"
	@echo " docker-build - Build Docker image"
	@echo " docker-run - Run development server with hot-reload"
	@echo " docker-export - Build in Docker and export build artifacts"

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
	rm -rf dist
	docker rmi $(PROJECT_NAME) || true

# Docker install & build with environment variable to skip native modules
.PHONY: docker-build
docker-build:
	DOCKER_BUILDKIT=1 docker build --build-arg NODE_VERSION=$(NODE_VERSION) --target builder -t $(PROJECT_NAME) -f ./Dockerfile .

# Docker export build artifacts
.PHONY: docker-export
docker-export: docker-build
	docker create --name $(PROJECT_NAME)-export $(PROJECT_NAME)
	mkdir -p dist
	docker cp $(PROJECT_NAME)-export:/app/dist ./dist
	docker rm $(PROJECT_NAME)-export

# Run development server with hot-reload and environment variables
.PHONY: docker-run
docker-run:
	docker run -it --rm -p 3000:3000 \
		-v $(PWD):/app \
		-w /app \
		-e ROLLUP_SKIP_NATIVE=1 \
		$(PROJECT_NAME) npm run dev

# Run node command in Docker container
# make docker-run-node-cmd CMD="npm install vite"
.PHONY: docker-run-node-cmd
docker-run-node-cmd:
	docker run -it --rm \
		-v $(PWD):/app \
		-w /app \
		-e ROLLUP_SKIP_NATIVE=1 \
		node:$(NODE_VERSION) $(CMD)
