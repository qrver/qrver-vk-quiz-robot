import { sendPhotoWithDelay, sendWithDelay } from '../service/vk.service';
import { MessageContext } from 'vk-io';
import {
    type UserSession,
    setUserSession,
    handleNotActivated,
    handleQuizEnded,
} from './user-session/user-session.service';
import {
    handleRegistrationCityAnswer,
    handleRegistrationCityConfirm,
    handleRegistrationCompanyAnswer,
    handleRegistrationConfirmation,
    handleRegistrationNameAnswer,
    handleRegistrationWorkplaceAnswer,
} from './user-registration/user-registration.service';
import { MESSAGE_TEXTS, QUIZ_ENABLED } from 'src/config/constants';
import {
    handleQuestion1,
    handleQuestion1Answer,
    handleQuestion2Answer,
    handleQuestion3Answer,
    handleQuestion4Answer,
    handleQuestion5Answer,
} from './quiz-answer/quiz-answer.service';

// Главный обработчик сообщений
export async function vkRoutes(context: MessageContext, session: UserSession) {
    try {
        console.log(
            `[message][${context.senderId}][${session.state}]: ${context.text}`,
        );

        switch (session.state) {
            // Start session

            case UserState.NOT_ACTIVATED:
                await handleNotActivated(context, session);
                break;

            // Quiz
            case UserState.ACTIVATED:
                if (QUIZ_ENABLED) await handleQuestion1(context, session);
                else await handleQuizEnded(context, session);
                break;

            case UserState.QUESTION_1:
                if (QUIZ_ENABLED) await handleQuestion1Answer(context, session);
                else await handleQuizEnded(context, session);
                break;

            case UserState.QUESTION_2:
                if (QUIZ_ENABLED) await handleQuestion2Answer(context, session);
                else await handleQuizEnded(context, session);
                break;

            case UserState.QUESTION_3:
                if (QUIZ_ENABLED) await handleQuestion3Answer(context, session);
                else await handleQuizEnded(context, session);
                break;

            case UserState.QUESTION_4:
                if (QUIZ_ENABLED) await handleQuestion4Answer(context, session);
                else await handleQuizEnded(context, session);
                break;

            case UserState.QUESTION_5:
                if (QUIZ_ENABLED) await handleQuestion5Answer(context, session);
                else await handleQuizEnded(context, session);
                break;

            // Registration
            case UserState.REGISTRATION_CONFIRMATION:
                await handleRegistrationConfirmation(context, session);
                break;

            case UserState.REGISTRATION_NAME:
                await handleRegistrationNameAnswer(context, session);
                break;

            case UserState.REGISTRATION_CITY:
                await handleRegistrationCityAnswer(context, session);
                break;

            case UserState.REGISTRATION_CITY_CONFIRM:
                await handleRegistrationCityConfirm(context, session);
                break;

            case UserState.REGISTRATION_COMPANY:
                await handleRegistrationCompanyAnswer(context, session);
                break;

            case UserState.REGISTRATION_WORKPLACE:
                await handleRegistrationWorkplaceAnswer(context, session);
                break;

            // Editing
            case UserState.EDITING_NAME:
                await handleRegistrationNameAnswer(context, session, true);
                break;

            case UserState.EDITING_CITY:
                await handleRegistrationCityAnswer(context, session, true);
                break;

            case UserState.EDITING_COMPANY:
                await handleRegistrationCompanyAnswer(context, session, true);
                break;

            case UserState.EDITING_WORKPLACE:
                await handleRegistrationWorkplaceAnswer(context, session, true);
                break;

            // End
            case UserState.COMPLETED:
                session.state = UserState.ENDED;
                await setUserSession(context.senderId, session);
                await sendPhotoWithDelay(
                    context,
                    MESSAGE_TEXTS.endMessage,
                    'end.jpg',
                    'clear',
                );
                break;

            // Без повторной отправки
            case UserState.ENDED:
                break;

            case UserState.QUIZ_ENDED:
                if (QUIZ_ENABLED) {
                    session.state = UserState.NOT_ACTIVATED;
                    await setUserSession(context.senderId, session);
                    await handleNotActivated(context, session);
                }
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await sendWithDelay(
            context,
            'Произошла ошибка. Попробуйте еще раз.',
            'clear',
        );
    }
}

// Типы состояний
export enum UserState {
    // Start session
    NOT_ACTIVATED = 'NOT_ACTIVATED',
    ACTIVATED = 'ACTIVATED',
    // Quiz
    QUESTION_1 = 'QUESTION_1',
    QUESTION_2 = 'QUESTION_2',
    QUESTION_3 = 'QUESTION_3',
    QUESTION_4 = 'QUESTION_4',
    QUESTION_5 = 'QUESTION_5',
    // Registration
    REGISTRATION_NAME = 'REGISTRATION_NAME',
    REGISTRATION_CITY = 'REGISTRATION_CITY',
    REGISTRATION_CITY_CONFIRM = 'REGISTRATION_CITY_CONFIRM',
    REGISTRATION_COMPANY = 'REGISTRATION_COMPANY',
    REGISTRATION_WORKPLACE = 'REGISTRATION_WORKPLACE',
    REGISTRATION_CONFIRMATION = 'REGISTRATION_CONFIRMATION',
    // Editing
    EDITING_NAME = 'EDITING_NAME',
    EDITING_CITY = 'EDITING_CITY',
    EDITING_COMPANY = 'EDITING_COMPANY',
    EDITING_WORKPLACE = 'EDITING_WORKPLACE',
    // End
    COMPLETED = 'COMPLETED',
    ENDED = 'ENDED',
    // ENDED
    QUIZ_ENDED = 'QUIZ_ENDED',
}
