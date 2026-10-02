import express from 'express';
import cors from 'cors';
import partnerRoutes from '../routes/partnerRoutes.js';
import materialRoutes from '../routes/materialRoutes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json());

// Подключаем наши маршруты с префиксом /api
app.use('/api', partnerRoutes);
app.use('/api', materialRoutes);

export default app;
