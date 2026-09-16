import express from 'express';
import cors from 'cors';

const app = express();

// Разрешаем запросы от React (Vite) приложения
app.use(cors({ origin: 'http://localhost:5173' }));

export function calculatePartnerDiscount(totalQuantity) {
    if (totalQuantity < 10000) {
        return 0;
    }
    if (totalQuantity < 50000) {
        return 5;
    }
    if (totalQuantity < 300000) {
        return 10;
    }
    return 15;
}

// Эндпоинт API для фронтенда
app.get('/api/calculate-discount', (req, res) => {
    const quantity = parseInt(req.query.quantity, 10) || 0;
    const discountPercentage = calculatePartnerDiscount(quantity);

    res.json({
        quantity: quantity,
        discount: discountPercentage
    });
});

// Запускаем сервер, только если файл запущен напрямую, а не вызван в тестах
if (process.env.NODE_ENV !== 'test') {
    app.listen(8000, () => {
        console.log('Node.js сервер запущен на http://localhost:8000');
    });
}

export default app;
