# Используем официальный Node.js образ
FROM node:22-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем воспроизводимый набор зависимостей
RUN npm ci

# Копируем исходный код, схему Prisma и конфигурацию TypeScript
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript
RUN npm run build

# Удаляем dev-зависимости для уменьшения размера
RUN npm prune --omit=dev

RUN chown -R nodejs:nodejs /app/media

USER nodejs

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]
