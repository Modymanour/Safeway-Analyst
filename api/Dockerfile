FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:pretty"]