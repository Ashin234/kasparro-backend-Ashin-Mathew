# Use Node.js base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy entire project
COPY . .

# Expose API port
EXPOSE 3000

# Start API + ETL
CMD ["npm", "run", "start"]
