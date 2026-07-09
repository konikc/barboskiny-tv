FROM node:18-slim

# Копируем уже готовый статический FFmpeg (это займет 2 секунды вместо 10 минут!)
COPY --from=mwader/static-ffmpeg:6.1 /ffmpeg /usr/local/bin/

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
