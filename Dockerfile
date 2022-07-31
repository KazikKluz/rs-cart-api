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

ENV NODE_ENV=production

#copy all bundled code from base to application
COPY --from=base /app/package*.json ./
#do clean install without dev dependencies
RUN npm ci --only=production
COPY --from=base /app/dist ./dist

USER node
#expose ports from the image
ENV PORT=8080
EXPOSE 8080
#start application with command node dist/index.js
CMD ["node", "dist/main.js"]

