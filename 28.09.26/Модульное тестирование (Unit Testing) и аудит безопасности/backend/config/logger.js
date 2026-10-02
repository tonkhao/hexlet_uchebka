import fs from 'fs';
import path from 'path';

// Отчетный лог рядом с бэкендом: backend/app.log
const LOG_FILE_NAME = 'app.log';
const LOG_FILE_PATH = path.resolve(process.cwd(), LOG_FILE_NAME);

// Формат записи: 2026-10-02 14:35:07 [ERROR] текст сообщения
function formatTimestamp(date) {
    const pad = value => String(value).padStart(2, '0');
    return [
        date.getFullYear(),
        '-',
        pad(date.getMonth() + 1),
        '-',
        pad(date.getDate()),
        ' ',
        pad(date.getHours()),
        ':',
        pad(date.getMinutes()),
        ':',
        pad(date.getSeconds()),
    ].join('');
}

// Текст ошибки должен быть понятен человеку, а не только движку:
// извлекаются сообщение, код и имя класса
function describeError(error) {
    if (error instanceof Error) {
        const code = error.code ? ` [code: ${error.code}]` : '';
        return `${error.name}${code}: ${error.message}`;
    }
    if (error === null || error === undefined) {
        return 'Неизвестная ошибка (пустое значение)';
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return `Неизвестная ошибка: ${JSON.stringify(error)}`;
    } catch {
        return 'Неизвестная ошибка (не удалось сериализовать значение)';
    }
}

/**
 * Простейшее логирование ошибок в отчетный файл app.log.
 * Запись синхронная: строка гарантированно попадает в файл
 * до продолжения обработки запроса.
 */
function writeLog(level, message) {
    const line = `${formatTimestamp(new Date())} [${level}] ${message}`;
    try {
        fs.appendFileSync(LOG_FILE_PATH, `${line}\n`, 'utf8');
    } catch (error) {
        // Файл лога недоступен: приложение продолжает работать,
        // потеря лога не должна превращаться в отказ обслуживания
        console.error('Не удалось записать запись в лог:', error.message);
    }
    return line;
}

export const logger = {
    error(context, error) {
        return writeLog('ERROR', `${context} -> ${describeError(error)}`);
    },

    warning(context, message) {
        return writeLog('WARNING', `${context} -> ${message}`);
    },

    info(context, message) {
        return writeLog('INFO', `${context} -> ${message}`);
    },
};

// Экспорт для проверки формата из тестов
export { LOG_FILE_PATH, LOG_FILE_NAME, formatTimestamp, describeError };