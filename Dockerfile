#pull base image
FROM node:alpine as base
#create app directory
WORKDIR /app

#dependencies
FROM base as deps
COPY package*.json ./
RUN npm install

#build
FROM deps as build
WORKDIR /app
COPY . .
RUN npm run build

#application
FROM node:alpine as application

ENV NODE_ENV production

#copy all bundled code from build to application
COPY --from=build /app/package*.json ./
#do clean install without dev dependencies
RUN npm ci --only=production
COPY --from=build /app/dist ./dist

USER node
#expose ports from the image
ENV PORT=8080
EXPOSE 8080
#start application with command node dist/index.js
CMD ["node", "dist/main.js"]

