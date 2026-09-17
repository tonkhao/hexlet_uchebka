import express from 'express';
import { getPartnerWithDiscount } from '../services/parnerService.js';

const router = express.Router();

router.get('/partner/:id', async (req, res) => {
    try {
        const partnerId = parseInt(req.params.id, 10);
        const partner = await getPartnerWithDiscount(partnerId);

        if (!partner) {
            return res.status(404).json({ error: 'Партнер не найден' });
        }

        res.json(partner);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при работе с БД' });
    }
});

export default router;
