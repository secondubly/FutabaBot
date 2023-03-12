FROM node:16-buster-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json .

# Setup node environment
# This should be explicitly set to production on release
ENV NODE_ENV="development"

# Install packages
RUN npm ci

# Copy base tsconfig file
COPY tsconfig.base.json tsconfig.base.json

# Copy our generated prisma files
COPY prisma ./prisma

# Copy src files
COPY src/ src/

# Copy .env file for development
COPY src/.env.development.local src/.env.development.local

# Generate prisma client
RUN npx prisma generate

# Build the project
RUN npm run build

CMD ["npm", "run", "start"]