FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
# El seed se salta solo si la base ya tiene datos
CMD ["sh", "-c", "node src/utils/seed.js && node src/server.js"]
