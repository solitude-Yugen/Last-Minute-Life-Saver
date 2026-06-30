FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build the Vite frontend
RUN npm run build

# Cloud Run sets PORT env var
ENV PORT=8080
EXPOSE 8080

# Start the Express server
CMD ["node", "server.js"]
