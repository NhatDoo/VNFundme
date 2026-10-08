FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
