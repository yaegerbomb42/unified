FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
ENV PORT=3017
EXPOSE 3017
CMD ["node", "index.js"]
