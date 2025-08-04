FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3000

CMD npx prisma migrate deploy && npm start