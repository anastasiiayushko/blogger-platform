# Базовый образ Node.js
FROM node:22.14.0

# Рабочая директория внутри контейнера
WORKDIR /usr/src/app

# Сначала копируем только package-файлы для кеширования слоя с зависимостями
COPY package*.json ./

# Dev-режим и установка всех зависимостей (включая devDependencies)
ENV NODE_ENV=development
RUN npm ci

# Копируем исходный код приложения (включая tsconfig.json)
COPY . .

# Порт, на котором стартует NestJS
EXPOSE 3000

# Запуск приложения в режиме разработки (watch)
CMD ["npm", "run", "docker:dev"]
