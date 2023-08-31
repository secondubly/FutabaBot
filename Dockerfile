FROM node:18-buster-slim

# Setup node environment
# This should be explicitly set to production on release
ENV NODE_ENV="development"

# Prisma requires libssl-dev and ca-certificates as dependencies, so we install them here
RUN apt-get update && apt-get install libssl-dev ca-certificates -y

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json .

# Copy base tsconfig file
COPY tsconfig.base.json tsconfig.base.json

# Copy our generated prisma files
COPY prisma ./prisma

# Copy src files
COPY src/ src/

# Install packages
RUN npm ci

# Generate prisma client
RUN npx prisma generate

# Build the project
RUN npm run build

# Run the start script in package.json
CMD ["npm", "run", "start:docker"]