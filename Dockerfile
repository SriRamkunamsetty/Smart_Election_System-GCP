FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Cloud Run injects the PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start the application, passing the dynamic port to vite preview
CMD ["sh", "-c", "npx vite preview --port $PORT --host 0.0.0.0"]
