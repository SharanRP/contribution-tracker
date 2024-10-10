# Dockerfile for Development with Hot Reload
FROM node:18-alpine AS dev

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

COPY . .

EXPOSE 3000 10000

# Use nodemon for hot reloading
CMD ["nodemon", "--watch", ".", "--ext", "js,json", "v1.js"]

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

# .dockerignore example:
# ----------------------
# node_modules
# npm-debug.log
# Dockerfile*
# .dockerignore
# .env
