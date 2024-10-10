# Base image for development
FROM node:18-alpine AS dev

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g nodemon

# Copy the application code
COPY . .

# Expose necessary ports
EXPOSE 3000 10000

# Use nodemon for hot reloading during development
CMD ["nodemon", "--watch", ".", "--ext", "js,json", "v1.js"]

# -----------------------------------------------
# Production Stage
FROM node:18-alpine AS prod

# Set working directory
WORKDIR /usr/src/app

# Copy package files for production
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the application code
COPY . .

# Expose necessary ports
EXPOSE 3000 10000

# Start the application in production mode
CMD ["node", "v1.js"]

# -----------------------------------------------
# Docker build command for development:
# docker build --target dev -t discord-bot-dev .

# Docker run command for development with hot reload:
# docker run -it \
#   -p 3000:3000 \
#   -p 10000:10000 \
#   --env-file .env \
#   --name discord-bot-dev \
#   --mount type=bind,source=$(pwd),target=/usr/src/app \
#   discord-bot-dev

# This command mounts the current directory inside the container and uses nodemon.
# Any changes made to the code will trigger an automatic restart of the application.

# -----------------------------------------------
# Docker build command for production:
# docker build --target prod -t discord-bot-prod .

# Docker run command for production:
# docker run -it \
#   -p 3000:3000 \
#   -p 10000:10000 \
#   --env-file .env \
#   --name discord-bot-prod \
#   discord-bot-prod

# -----------------------------------------------
# .dockerignore example:
# ----------------------
# node_modules
# npm-debug.log
# Dockerfile*
# .dockerignore
# .env




# # Login to Docker Hub
# docker login

# # Build images
# docker build --target dev -t zephop/discord-bot:dev .
# docker build --target prod -t zephop/discord-bot:prod .

# # Verify images
# docker images

# # Push images to Docker Hub
# docker push zephop/discord-bot:dev
# docker push zephop/discord-bot:prod

