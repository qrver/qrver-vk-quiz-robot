import { Keyboard, MessageContext } from 'vk-io';
import {
    UserSession,
    setUserSession,
} from '../user-session/user-session.service';
import {
    CITIES,
    COMPANIES,
    DELAYS,
    MESSAGE_TEXTS,
    WORKPLACES,
} from 'src/config/constants';
import { sendPhotoWithDelay, sendWithDelay } from 'src/service/vk.service';
import { UserState } from '../routes';
import { prisma } from 'src/service/prisma.service';

export async function showRegistrationConfirmation(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const keyboard = Keyboard.builder()
        .textButton({
            label: MESSAGE_TEXTS.registrationConfirmation.change.buttons.name,
            payload: { edit: 'name' },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.registrationConfirmation.change.buttons.city,
            payload: { edit: 'city' },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.registrationConfirmation.change.buttons
                .company,
            payload: { edit: 'company' },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.registrationConfirmation.change.buttons
                .workplace,
            payload: { edit: 'workplace' },
        })
        .row()
        .textButton({
            label: MESSAGE_TEXTS.registrationConfirmation.change.buttons
                .confirm,
            payload: { confirm: true },
        });

    await sendWithDelay(
        context,
        '📋 Проверьте данные регистрации:\n\n' +
            `👤 ФИО: ${session.registration.name}\n` +
            `🏙️ Город: ${session.registration.city}\n` +
            `🏢 Компания: ${session.registration.company}\n` +
            `🏭 Место работы: ${session.registration.workplace}\n\n` +
            'Вы можете изменить любое поле или завершить регистрацию:',
        keyboard,
    );
}

export async function handleRegistrationConfirmation(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const payload = context.messagePayload;

    if (payload?.confirm) {
        // Завершаем регистрацию и сохраняем в базу данных
        session.state = UserState.COMPLETED;
        await setUserSession(context.senderId, session);

        await saveRegistrationToDatabase(
            context.senderId,
            session.registration,
        );

        await sendPhotoWithDelay(
            context,
            MESSAGE_TEXTS.registrationConfirmation.accept.text,
            'end.jpg',
            'clear',
        );
    } else if (payload?.edit) {
        const fieldToEdit = payload.edit;

        switch (fieldToEdit) {
            case 'name':
                session.state = UserState.EDITING_NAME;
                await setUserSession(context.senderId, session);
                await handleRegistrationName(context, session);
                break;
            case 'city':
                session.state = UserState.EDITING_CITY;
                await setUserSession(context.senderId, session);
                await handleRegistrationCity(context, session);
                break;
            case 'company':
                session.state = UserState.EDITING_COMPANY;
                await setUserSession(context.senderId, session);
                await handleRegistrationCompany(context, session);
                break;
            case 'workplace':
                session.state = UserState.EDITING_WORKPLACE;
                await setUserSession(context.senderId, session);
                await handleRegistrationWorkplace(context, session);
                break;
        }
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registrationConfirmation.error.text,
            'clear',
            DELAYS.SHORT,
        );
        await showRegistrationConfirmation(context, session);
    }
}

export async function handleRegistrationName(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    await sendWithDelay(context, MESSAGE_TEXTS.registraion.name.text, 'clear');
}

export async function handleRegistrationNameAnswer(
    context: MessageContext,
    session: UserSession,
    isEditing: boolean = false,
): Promise<void> {
    if (typeof context.text?.trim() === 'string') {
        if (!isEditing) {
            session.registration.name = context.text.trim();
            session.state = UserState.REGISTRATION_CITY;
            await setUserSession(context.senderId, session);
            await handleRegistrationCity(context, session);
        } else {
            session.registration.name = context.text.trim();
            session.state = UserState.REGISTRATION_CONFIRMATION;
            await setUserSession(context.senderId, session);
            await showRegistrationConfirmation(context, session);
        }
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registraion.name.errorMessage,
        );
    }
}

export async function handleRegistrationCity(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    // Создаем обычную клавиатуру для городов (максимум 10 строк)
    let keyboard = Keyboard.builder();

    // Размещаем города по 2 кнопки на строку (получится 7 строк)
    const citiesPerRow = 2;
    for (let i = 0; i < CITIES.length; i += citiesPerRow) {
        const row = CITIES.slice(i, i + citiesPerRow);
        row.forEach((city) => {
            keyboard = keyboard.textButton({ label: city, payload: { city } });
        });
        if (i + citiesPerRow < CITIES.length) {
            keyboard = keyboard.row();
        }
    }

    await sendWithDelay(context, MESSAGE_TEXTS.registraion.city.text, keyboard);
}

export async function handleRegistrationCityAnswer(
    context: MessageContext,
    session: UserSession,
    isEditing: boolean = false,
): Promise<void> {
    const selectedCity = context.messagePayload?.city;

    if (selectedCity && CITIES.includes(selectedCity)) {
        session.registration.city = selectedCity;
        if (!isEditing) {
            session.state = UserState.REGISTRATION_CITY_CONFIRM;
            await setUserSession(context.senderId, session);

            const keyboard = Keyboard.builder()
                .textButton({
                    label: MESSAGE_TEXTS.registraion.city.changeButton,
                    payload: { change_city: true },
                })
                .textButton({
                    label: MESSAGE_TEXTS.registraion.city.acceptButton,
                    payload: { confirm_city: true },
                });

            await sendWithDelay(
                context,
                MESSAGE_TEXTS.registraion.city.acceptMessage +
                    `\n\n${MESSAGE_TEXTS.registraion.city.cityMessage} ${selectedCity}`,
                keyboard,
            );
        } else {
            session.registration.city = selectedCity;
            session.state = UserState.REGISTRATION_CONFIRMATION;
            await setUserSession(context.senderId, session);
            await showRegistrationConfirmation(context, session);
        }
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registraion.city.errorMessage,
            'clear',
            DELAYS.SHORT,
        );

        await handleRegistrationCity(context, session);
    }
}

export async function handleRegistrationCityConfirm(
    context: MessageContext,
    session: UserSession,
): Promise<void> {
    const payload = context.messagePayload;

    if (payload?.confirm_city) {
        session.state = UserState.REGISTRATION_COMPANY;
        await setUserSession(context.senderId, session);
        await handleRegistrationCompany(context, session);
    } else if (payload?.change_city) {
        session.state = UserState.REGISTRATION_CITY;
        await setUserSession(context.senderId, session);
        await handleRegistrationCity(context, session);
    } else {
        const keyboard = Keyboard.builder()
            .textButton({
                label: MESSAGE_TEXTS.registraion.city.changeButton,
                payload: { change_city: true },
            })
            .textButton({
                label: MESSAGE_TEXTS.registraion.city.acceptButton,
                payload: { confirm_city: true },
            });

        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registraion.city.acceptMessage,
            keyboard,
        );
    }
}

export async function handleRegistrationCompany(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    let keyboard = Keyboard.builder();

    const companiesPerRow = 1;
    for (let i = 0; i < COMPANIES.length; i += companiesPerRow) {
        const row = COMPANIES.slice(i, i + companiesPerRow);
        row.forEach((company) => {
            const label = company;
            keyboard = keyboard.textButton({
                label,
                payload: { company: company },
            });
        });
        if (i + companiesPerRow < COMPANIES.length) {
            keyboard = keyboard.row();
        }
    }

    await sendWithDelay(
        context,
        MESSAGE_TEXTS.registraion.company.text,
        keyboard,
    );
}

export async function handleRegistrationCompanyAnswer(
    context: MessageContext,
    session: UserSession,
    isEditing: boolean = false,
): Promise<void> {
    const selectedCompany = context.messagePayload?.company;

    if (selectedCompany && COMPANIES.includes(selectedCompany)) {
        session.registration.company = selectedCompany;
        if (!isEditing) {
            session.state = UserState.REGISTRATION_WORKPLACE;
            await setUserSession(context.senderId, session);
            await handleRegistrationWorkplace(context, session);
        } else {
            session.state = UserState.REGISTRATION_CONFIRMATION;
            await setUserSession(context.senderId, session);
            await showRegistrationConfirmation(context, session);
        }
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registraion.company.errorMessage,
            'clear',
            DELAYS.SHORT,
        );

        await handleRegistrationCompany(context, session);
    }
}

export async function handleRegistrationWorkplace(
    context: MessageContext,
    _session: UserSession,
): Promise<void> {
    let keyboard = Keyboard.builder();

    const workplacesPerRow = 2;
    for (let i = 0; i < WORKPLACES.length; i += workplacesPerRow) {
        const row = WORKPLACES.slice(i, i + workplacesPerRow);
        row.forEach((workplace) => {
            keyboard = keyboard.textButton({
                label: workplace,
                payload: { workplace },
            });
        });
        if (i + workplacesPerRow < WORKPLACES.length) {
            keyboard = keyboard.row();
        }
    }

    await sendWithDelay(
        context,
        MESSAGE_TEXTS.registraion.workplace.text,
        keyboard,
    );
}

export async function handleRegistrationWorkplaceAnswer(
    context: MessageContext,
    session: UserSession,
    isEditing: boolean = false,
): Promise<void> {
    const selectedWorkplace = context.messagePayload?.workplace;

    if (selectedWorkplace && WORKPLACES.includes(selectedWorkplace)) {
        session.registration.workplace = selectedWorkplace;
        if (isEditing) {
            session.state = UserState.REGISTRATION_CONFIRMATION;
            await setUserSession(context.senderId, session);
            await showRegistrationConfirmation(context, session);
        } else {
            session.state = UserState.REGISTRATION_CONFIRMATION;
            await setUserSession(context.senderId, session);
            await showRegistrationConfirmation(context, session);
        }
    } else {
        await sendWithDelay(
            context,
            MESSAGE_TEXTS.registraion.workplace.errorMessage,
            'clear',
            DELAYS.SHORT,
        );

        await handleRegistrationWorkplace(context, session);
    }
}

export async function saveRegistrationToDatabase(
    userId: number,
    registration: any,
): Promise<void> {
    try {
        await prisma.userRegistration.upsert({
            where: { userId },
            update: {
                name: registration.name,
                city: registration.city,
                company: registration.company,
                workplace: registration.workplace,
                updatedAt: new Date(),
            },
            create: {
                userId,
                name: registration.name,
                city: registration.city,
                company: registration.company,
                workplace: registration.workplace,
            },
        });
    } catch (error) {
        console.error('Error saving registration to database:', error);
    }
}
