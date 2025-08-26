FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Install runtime deps for healthcheck and Next.js on Alpine
RUN apk add --no-cache curl libc6-compat

# Ensure start script is executable and has Unix line endings (fix CRLF on Windows hosts)
RUN chmod +x ./start.sh && sed -i 's/\r$//' ./start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application via entrypoint that builds if .next is missing
CMD ["sh", "-c", "./start.sh"]