FROM node:alpine as base

WORKDIR /app
#dependencies
COPY package*.json ./
RUN npm install

#build
WORKDIR /app
COPY . .
RUN npm run build

#application
FROM node:alpine as application

COPY --from=base /app/package*.json ./
RUN npm install --only=production
RUN npm install pm2 -g
COPY --from=base /app/dist ./dist

USER node
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/main.js"]

