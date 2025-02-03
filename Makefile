# Makefile for PDF Merger Webapp

# Variables
PROJECT_NAME = web-tools
NODE_VERSION=23

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  start      - Start development server"
	@echo "  build      - Build production application"
	@echo "  test       - Run tests"
	@echo "  lint       - Run linter"
	@echo "  clean      - Remove build artifacts and dependencies"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run development server with hot-reload"

# Local development targets
.PHONY: install
install:
	npm install

.PHONY: start
start:
	npm start

.PHONY: build
build:
	npm run build

.PHONY: test
test:
	npm test

.PHONY: lint
lint:
	npm run lint

# Cleanup
.PHONY: clean
clean:
	rm -rf node_modules
	rm -rf build
	docker rmi $(PROJECT_NAME) || true

# Docker install & build
.PHONY: docker-build
docker-build:
	docker build  --build-arg NODE_VERSION=$(NODE_VERSION) --target builder -t $(PROJECT_NAME) -f ./Dockerfile .

# Run development server with hot-reload
.PHONY: docker-run
docker-run: docker-build
	# npm run dev
	docker run -it --rm -p 3000:3000 -v $(PWD):/app $(PROJECT_NAME) npm start

# Initialize Vite+React template
.PHONY: docker-create-app
docker-create-app:
	docker run -it --rm -v $(PWD):/app node:$(NODE_VERSION) npm create vite@latest . -- --template react-ts
