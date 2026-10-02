import express from 'express';
import cors from 'cors';
import partnerRoutes from '../routes/partnerRoutes.js';
import materialRoutes from '../routes/materialRoutes.js';
import { logger } from '../config/logger.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json());

// Подключаем наши маршруты с префиксом /api
app.use('/api', partnerRoutes);
app.use('/api', materialRoutes);

// Ошибка разбора некорректного JSON фиксируется отдельно:
// клиент прислал тело, которое express не смог разобрать.
// Обработчик стоит первым, иначе его перехватит общий.
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        logger.warning(`Некорректный JSON в ${req.method} ${req.originalUrl}`, error.message);
        return res.status(400).json({ error: 'Некорректный формат тела запроса' });
    }
    return next(error);
});

// Любая другая необработанная ошибка, включая сбои соединения с СУБД
app.use((error, req, res, next) => {
    logger.error(`Необработанная ошибка ${req.method} ${req.originalUrl}`, error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

export default app;
