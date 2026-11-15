# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the Next.js port
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "start"]