import express from 'express';
import cors from 'cors';
import partnerRoutes from '../routes/partnerRoutes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json());

// Подключаем наши маршруты с префиксом /api
app.use('/api', partnerRoutes);

export default app;
