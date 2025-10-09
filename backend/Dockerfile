FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (production)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/app.js"]
