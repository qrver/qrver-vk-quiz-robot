import path from 'path';
import fs from 'fs/promises';
import { vk } from 'src/service/vk.service';

export type PublicPhotos = {
    'welcome.jpg': string;
    'question-1.jpg': string;
    'question-2.jpg': string;
    'question-3.jpg': string;
    'question-4.jpg': string;
    'question-5.jpg': string;
    'end.jpg': string;
};

class MediaPublicService {
    private readonly publicDir: string;
    private readonly metaDataPath: string;
    public availablePhotos: Record<string, string> = {};

    constructor() {
        this.publicDir = path.join(process.cwd(), 'media', 'public');
        this.metaDataPath = path.join(this.publicDir, 'meta-data.json');
    }

    public async init() {
        await this.checkDirAndMetaData();
        await this.syncPublicDirWithVK();
        await this.getAvailablePhotos();
    }

    private async checkDirAndMetaData() {
        try {
            await fs.access(this.publicDir);
        } catch {
            await fs.mkdir(this.publicDir, { recursive: true });
            console.log(`Директория ${this.publicDir} создана`);
        }

        try {
            await fs.access(this.metaDataPath);
        } catch {
            await fs.writeFile(this.metaDataPath, '{}');
            console.log(`Файл meta-data.json создан`);
        }

        console.log('Директория и файл meta-data.json проверены');
    }

    // Функция для отправки фотографии из локальной папки
    private async uploadPhotoToVK(photoPath: string): Promise<string> {
        try {
            const fullPath = path.join(
                process.cwd(),
                'media',
                'public',
                photoPath,
            );

            try {
                await fs.access(fullPath);
            } catch {
                throw new Error(`Файл не найден: ${fullPath}`);
            }

            // Загрузка фото
            const photo = await vk.upload.messagePhoto({
                source: { value: await fs.readFile(fullPath) },
            });

            // Мета-данные фото с сервера
            const { ownerId, id, accessKey } = photo;
            const vkId = `photo${ownerId}_${id}_${accessKey}`;

            return vkId;
        } catch (error) {
            console.error('Ошибка при загрузке фото:', error);
            throw error;
        }
    }

    private async syncPublicDirWithVK(): Promise<void> {
        try {
            console.log('Синхронизация PublicDir с VK...');
            const currentFiles = await fs.readdir(this.publicDir);
            const syncedFiles = JSON.parse(
                await fs.readFile(this.metaDataPath, 'utf8'),
            );

            for (const file of currentFiles) {
                if (
                    (syncedFiles[file] &&
                        String(syncedFiles[file]).length >= 10) ||
                    file === 'meta-data.json'
                ) {
                    console.log('Пропускаю синхронизацию файла:', file);
                    continue;
                }

                const vkId = await this.uploadPhotoToVK(file);

                syncedFiles[file] = vkId;
                console.log('Синхронизирован файл:', file);
            }

            await fs.writeFile(
                this.metaDataPath,
                JSON.stringify(syncedFiles, null, 2),
            );
        } catch (error) {
            console.error('Ошибка при синхронизации с VK:', error);
        }
    }

    private async getAvailablePhotos(): Promise<Record<string, string>> {
        const photos = JSON.parse(await fs.readFile(this.metaDataPath, 'utf8'));
        this.availablePhotos = photos;
        console.log(
            'Доступные фото: ',
            Object.keys(photos).join(', ').trim() || 'нет фото',
        );
        return photos;
    }

    public async getPhotoId(
        photoName: keyof PublicPhotos,
    ): Promise<PublicPhotos[keyof PublicPhotos]> {
        const photoId = this.availablePhotos[photoName];
        if (!photoId) {
            console.error(`Фото не найдено: ${photoName}`);
            throw new Error(`Фото не найдено: ${photoName}`);
        }
        return photoId;
    }
}

export const mediaPublicService = new MediaPublicService();
