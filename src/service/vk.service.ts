import {
    PublicPhotos,
    mediaPublicService,
} from 'src/modules/media-public/media-public.service';
import '../config/env';
import { Keyboard, MessageContext, VK } from 'vk-io';

export const vk = new VK({
    token: process.env['VK_TOKEN']!,
    apiLimit: Number(process.env['VK_API_LIMIT']) || 3,
});

// Утилиты для сообщений
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Функция для отправки сообщения с задержкой
export async function sendWithDelay(
    context: MessageContext,
    text: string,
    keyboard?: any,
    delayMs: number = 0,
    attachmentVkId?: string | undefined,
): Promise<void> {
    try {
        const keyboardToSend =
            keyboard === 'clear' ? Keyboard.builder().oneTime() : keyboard;

        await context.send(
            text,
            attachmentVkId === undefined
                ? { keyboard: keyboardToSend }
                : { keyboard: keyboardToSend, attachment: attachmentVkId },
        );
    } catch (error) {
        console.error(
            `[error-message][${context.senderId}]: text: ${text}, keyboard: ${keyboard}, delayMs: ${delayMs}, attachmentVkId: ${attachmentVkId}`,
            error,
        );
    }

    // Постфиксная задержка - применяется к следующему сообщению
    if (delayMs > 0) {
        await delay(delayMs);
    }
}

// Функция для отправки фото с задержкой
export async function sendPhotoWithDelay(
    context: MessageContext,
    text: string,
    photoPath: keyof PublicPhotos,
    keyboard?: any,
    delayMs: number = 0,
): Promise<void> {
    const photoId = await mediaPublicService.getPhotoId(photoPath);
    await sendWithDelay(context, text, keyboard, delayMs, photoId);
}
