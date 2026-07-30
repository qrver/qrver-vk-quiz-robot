import './src/config/env';
import { prisma } from './src/service/prisma.service';
import { vk } from './src/service/vk.service';
import { getUserSession } from './src/modules/user-session/user-session.service';
import { vkRoutes } from './src/modules/routes';
import { MessageContext } from 'vk-io';
import { mediaPublicService } from 'src/modules/media-public/media-public.service';

// Запуск бота
async function startBot(): Promise<void> {
    console.log('Запускаем бота...');

    try {
        await prisma.connect();
        await vk.updates.start();
        await mediaPublicService.init();
        console.log('Бот успешно запущен!');
    } catch (error) {
        console.error('Ошибка при запуске бота:', error);
        process.exit(1);
    }
}

vk.updates.on('message_new', async (context: MessageContext) => {
    if (!context.isFromUser) return;

    const session = await getUserSession(context.senderId);

    await vkRoutes(context, session);
});

/**
 * Функция для корректного завершения работы бота.
 * Останавливает long polling и закрывает соединения с базой данных.
 */
async function shutdownBot(): Promise<void> {
    console.log('Останавливаем бота...');

    try {
        // Останавливаем long polling VK
        await vk.updates.stop();
        console.log('Long polling VK остановлен.');

        // Закрываем соединение с базой данных Prisma
        await prisma.disconnect();
        console.log('Соединение с базой данных закрыто.');
    } catch (error) {
        console.error('Ошибка при завершении работы бота:', error);
    } finally {
        process.exit(0);
    }
}

// Обработка сигналов завершения процесса для корректного shutdown
process.on('SIGINT', shutdownBot);
process.on('SIGTERM', shutdownBot);

startBot();
