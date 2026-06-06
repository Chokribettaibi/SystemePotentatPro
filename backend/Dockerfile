FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 5000

# Run initDb before starting to ensure database is created, tables are created and seeded.
CMD ["sh", "-c", "node dist/config/initDb.js && node dist/index.js"]
