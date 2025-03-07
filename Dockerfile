ARG NODE_VERSION=20

# Build stage
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Set environment variable to force Rollup to use JS implementation
# This MUST be set before any npm commands
ENV ROLLUP_SKIP_NATIVE=1

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build --verbose

# Export stage - creates a minimal image with just the build artifacts
FROM scratch AS export-stage
COPY --from=builder /app/dist /dist
