FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Apply migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
