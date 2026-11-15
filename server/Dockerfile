# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Build the TypeScript code (assuming you have a build script in package.json)
RUN npm run build

# Expose the server port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]