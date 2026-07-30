import { MessageContext } from 'vk-io';
import { prisma } from '../../service/prisma.service';
import { UserState } from '../routes';
import {
    DELAYS,
    MESSAGE_TEXTS,
    ACTIVATION_PASSWORD,
    QUIZ_ENABLED,
} from 'src/config/constants';
import {
    sendPhotoWithDelay,
    sendWithDelay,
} from 'src/service/vk.service';

export type UserSession = {
    state: UserState;
    answers: {
        q1?: string | undefined;
        q2?: string | undefined;
        q3?: string | undefined;
        q4?: string | undefined;
        q5?: string | undefined;
    };
    registration: {
        name?: string | undefined;
        city?: string | undefined;
        company?: string | undefined;
        workplace?: string | undefined;
    };
};

export async function getUserSession(userId: number): Promise<UserSession> {
    try {
        const session = await prisma.userSession.findUnique({
            where: { userId },
        });

        if (session) {
            return {
                state: session.state as UserState,
                answers: {
                    q1: session.answer1 || undefined,
                    q2: session.answer2 || undefined,
                    q3: session.answer3 || undefined,
                    q4: session.answer4 || undefined,
                    q5: session.answer5 || undefined,
                },
                registration: {
                    name: session.registrationName || undefined,
                    city: session.registrationCity || undefined,
                    company: session.registrationCompany || undefined,
                    workplace: session.registrationWorkplace || undefined,
                },
            };
        }

        // Создаем новую сессию если не существует
        await prisma.userSession.create({
            data: {
                userId,
                state: UserState.NOT_ACTIVATED,
            },
        });

        return {
            state: UserState.NOT_ACTIVATED,
            answers: {},
            registration: {},
        };
    } catch (error) {
        console.error(userId, 'Error getting user session:', error);
        return {
            state: UserState.NOT_ACTIVATED,
            answers: {},
            registration: {},
        };
    }
}

export async function setUserSession(
    userId: number,
    session: UserSession,
): Promise<void> {
    try {
        await prisma.userSession.upsert({
            where: { userId },
            update: {
                state: session.state,
                answer1: session.answers.q1 || null,
                answer2: session.answers.q2 || null,
                answer3: session.answers.q3 || null,
                answer4: session.answers.q4 || null,
                answer5: session.answers.q5 || null,
                registrationName: session.registration.name || null,
                registrationCity: session.registration.city || null,
                registrationCompany: session.registration.company || null,
                registrationWorkplace: session.registration.workplace || null,
            },
            create: {
                userId,
                state: session.state,
                answer1: session.answers.q1 || null,
                answer2: session.answers.q2 || null,
                answer3: session.answers.q3 || null,
                answer4: session.answers.q4 || null,
                answer5: session.answers.q5 || null,
                registrationName: session.registration.name || null,
                registrationCity: session.registration.city || null,
                registrationCompany: session.registration.company || null,
                registrationWorkplace: session.registration.workplace || null,
            },
        });
    } catch (error) {
        console.error(userId, 'Error setting user session:', error);
    }
}

// Обработчики для первого состояния
export async function handleNotActivated(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    if (!QUIZ_ENABLED) {
        await handleQuizEnded(context, session);
        return;
    }

    if (
        ACTIVATION_PASSWORD !== undefined &&
        context.text?.trim().toLowerCase() === ACTIVATION_PASSWORD.trim().toLowerCase()
    ) {
        session.state = UserState.ACTIVATED;
        await setUserSession(context.senderId, session);

        const { handleQuestion1 } = await import('../quiz-answer/quiz-answer.service');
        await sendPhotoWithDelay(
            context,
            MESSAGE_TEXTS.welcome.text1,
            'welcome.jpg',
            'clear',
            DELAYS.LONG,
        );
        session.state = UserState.QUESTION_1;
        await setUserSession(context.senderId, session);
        await handleQuestion1(context, session);
    } else {
        // Не реагируем до ввода пароля
        return;
    }
}

export async function handleQuizEnded(
    context: MessageContext,
    session: UserSession,
) {
    session.state = UserState.QUIZ_ENDED;
    await setUserSession(context.senderId, session);

    await sendWithDelay(context, MESSAGE_TEXTS.quizCompleted.text, 'clear');
}
