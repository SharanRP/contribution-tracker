# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of your application
COPY . .

# Expose the ports your bot listens to
EXPOSE 3000 10000

# # Set environment variables
# ENV DISCORD_TOKEN=${DISCORD_TOKEN}
# ENV GITHUB_TOKEN=${GITHUB_TOKEN}

# Command to run the bot
CMD ["node", "v1.js"]

# Docker build command:
# docker build -t discord-bot .

# Docker run command:
# docker run -d -p 3000:3000 -p 10000:10000 --env-file .env --name discord-bot-container discord-bot