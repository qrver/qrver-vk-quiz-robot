import { Keyboard, MessageContext } from 'vk-io';
import {
    UserSession,
    setUserSession,
} from '../user-session/user-session.service';
import { DELAYS, MESSAGE_TEXTS } from 'src/config/constants';
import { sendPhotoWithDelay, sendWithDelay } from 'src/service/vk.service';
import { UserState } from '../routes';
import { handleRegistrationName } from '../user-registration/user-registration.service';
import { prisma } from 'src/service/prisma.service';

export async function handleQuestion1(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    const keyboard = Keyboard.builder()
        .textButton({
            label: MESSAGE_TEXTS.question1.answer1,
            payload: { answer: MESSAGE_TEXTS.question1.answer1 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question1.answer2,
            payload: { answer: MESSAGE_TEXTS.question1.answer2 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question1.answer3,
            payload: { answer: MESSAGE_TEXTS.question1.answer3 },
        });

    await sendPhotoWithDelay(
        context,
        MESSAGE_TEXTS.question1.text,
        'question-1.jpg',
        keyboard,
        DELAYS.MEDIUM,
    );
}

export async function handleQuestion1Answer(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const answer = context.messagePayload?.answer || context.text?.trim();

    if (answer === MESSAGE_TEXTS.question1.answer2) {
        session.answers.q1 = answer;
        await saveAnswerToDatabase(context.senderId, 1, answer);
        await setUserSession(context.senderId, session);

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question1.correctAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );

        session.state = UserState.QUESTION_2;
        await setUserSession(context.senderId, session);
        await handleQuestion2(context, session);
    } else if (
        [
            MESSAGE_TEXTS.question1.answer1,
            MESSAGE_TEXTS.question1.answer3,
        ].includes(answer)
    ) {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question1.wrongAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion1(context, session);
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question1.errorMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion1(context, session);
    }
}

export async function handleQuestion2(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    await sendPhotoWithDelay(
        context,
        MESSAGE_TEXTS.question2.text,
        'question-2.jpg',
    );
}

export async function handleQuestion2Answer(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const answer = context.text?.trim().toLowerCase();

    if (answer === MESSAGE_TEXTS.question2.answer.trim().toLowerCase()) {
        session.answers.q2 = context.text?.trim() || '';
        await saveAnswerToDatabase(context.senderId, 2, session.answers.q2);
        await setUserSession(context.senderId, session);

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question2.correctAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );

        session.state = UserState.QUESTION_3;
        await setUserSession(context.senderId, session);
        await handleQuestion3(context, session);
    } else if (typeof answer === 'string') {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question2.wrongAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion2(context, session);
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question2.errorMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion2(context, session);
    }
}

export async function handleQuestion3(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    // // Создаем обычную клавиатуру для городов (максимум 10 строк)
    // let keyboard = Keyboard.builder();

    // // Размещаем города по 2 кнопки на строку (получится 7 строк)
    // const answerPerRow = 1;
    // for (
    //     let i = 0;
    //     i < MESSAGE_TEXTS.question3.answer.length;
    //     i += answerPerRow
    // ) {
    //     const row = MESSAGE_TEXTS.question3.answer.slice(i, i + answerPerRow);
    //     row.forEach((answer) => {
    //         keyboard = keyboard.textButton({
    //             label: answer,
    //             payload: { answer },
    //         });
    //     });
    //     if (i + answerPerRow < MESSAGE_TEXTS.question3.answer.length) {
    //         keyboard = keyboard.row();
    //     }
    // }

    const keyboard = Keyboard.builder()
        .textButton({
            label: MESSAGE_TEXTS.question3.answer1,
            payload: { answer: MESSAGE_TEXTS.question3.answer1 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question3.answer2,
            payload: { answer: MESSAGE_TEXTS.question3.answer2 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question3.answer3,
            payload: { answer: MESSAGE_TEXTS.question3.answer3 },
        });

    await sendPhotoWithDelay(
        context,
        MESSAGE_TEXTS.question3.text,
        'question-3.jpg',
        keyboard,
    );
}

export async function handleQuestion3Answer(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const answer =
        context.messagePayload?.answer.trim().toLowerCase() ||
        context.text?.trim().toLowerCase();

    if (answer === MESSAGE_TEXTS.question3.answer1.trim().toLowerCase()) {
        session.answers.q3 = answer;
        await saveAnswerToDatabase(context.senderId, 3, answer);
        await setUserSession(context.senderId, session);

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question3.correctAnswerMessage,
            'clear',
            DELAYS.MEDIUM,
        );

        session.state = UserState.QUESTION_4;
        await setUserSession(context.senderId, session);
        await handleQuestion4(context, session);
    } else if (
        [
            MESSAGE_TEXTS.question3.answer2,
            MESSAGE_TEXTS.question3.answer3,
        ].includes(answer)
    ) {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question3.wrongAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion3(context, session);
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question3.errorMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion3(context, session);
    }
}

export async function handleQuestion4(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    const keyboard = Keyboard.builder()
        .textButton({
            label: MESSAGE_TEXTS.question4.answer1,
            payload: { answer: MESSAGE_TEXTS.question4.answer1 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question4.answer2,
            payload: { answer: MESSAGE_TEXTS.question4.answer2 },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.question4.answer3,
            payload: { answer: MESSAGE_TEXTS.question4.answer3 },
        });

    await sendPhotoWithDelay(
        context,
        MESSAGE_TEXTS.question4.text,
        'question-4.jpg',
        keyboard,
    );
}

export async function handleQuestion4Answer(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const answer = context.messagePayload?.answer || context.text?.trim();

    if (answer === MESSAGE_TEXTS.question4.answer1) {
        session.answers.q4 = answer;
        await saveAnswerToDatabase(context.senderId, 4, answer);
        await setUserSession(context.senderId, session);

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question4.correctAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );

        session.state = UserState.QUESTION_5;
        await setUserSession(context.senderId, session);
        await handleQuestion5(context, session);
    } else if (
        [
            MESSAGE_TEXTS.question4.answer2,
            MESSAGE_TEXTS.question4.answer3,
        ].includes(answer)
    ) {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question4.wrongAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion4(context, session);
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question4.errorMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion4(context, session);
    }
}

export async function handleQuestion5(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    await sendPhotoWithDelay(
        context,
        MESSAGE_TEXTS.question5.text,
        'question-5.jpg',
    );
}

export async function handleQuestion5Answer(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    if (
        context.text?.trim().toLowerCase() ===
        MESSAGE_TEXTS.question5.answer.trim().toLowerCase()
    ) {
        session.answers.q5 = context.text.trim();
        await saveAnswerToDatabase(context.senderId, 5, session.answers.q5);

        // Концовка квиза

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.endQuiz,
            'clear',
            DELAYS.MEDIUM,
        );

        // После 5-го вопроса сразу переходим к регистрации

        session.state = UserState.REGISTRATION_NAME;
        await setUserSession(context.senderId, session);
        await handleRegistrationName(context, session);
    } else if (typeof context.text?.trim() === 'string') {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question5.wrongAnswerMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion5(context, session);
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.question5.errorMessage,
            'clear',
            DELAYS.SHORT,
        );
        await handleQuestion5(context, session);
    }
}

// Функции для работы с базой данных
export async function saveAnswerToDatabase(
    userId: number,
    questionNumber: number,
    answer: string,
): Promise<void> {
    try {
        await prisma.quizAnswer.upsert({
            where: {
                userId_questionNumber: {
                    userId,
                    questionNumber,
                },
            },
            update: {
                answer,
                updatedAt: new Date(),
            },
            create: {
                userId,
                questionNumber,
                answer,
            },
        });
    } catch (error) {
        console.error('Error saving answer to database:', error);
    }
}
