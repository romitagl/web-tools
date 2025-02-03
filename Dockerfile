# Build the application
# update also .github/workflows/deploy-github-pages.yaml
ARG NODE_VERSION=23
FROM node:${NODE_VERSION}  AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@latest
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build --verbose

# -- SERVE --

# # Serve with Nginx
# FROM nginx:alpine as nginx

# # Copy build files to nginx directory
# COPY --from=builder /app/build /usr/share/nginx/html

# # Copy nginx configuration
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port
# EXPOSE 80

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]
