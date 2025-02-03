# Build the application
ARG NODE_VERSION
FROM node:${NODE_VERSION}  AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
# https://docs.npmjs.com/cli/v8/commands/npm-ci
# RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

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
