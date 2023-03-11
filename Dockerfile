FROM node:16-buster-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json .

# Install packages
RUN npm ci

# Copy base tsconfig file
COPY tsconfig.base.json tsconfig.base.json

# Copy src files
COPY src/ src/

RUN npm run build

CMD ["npm", "run", "start"]