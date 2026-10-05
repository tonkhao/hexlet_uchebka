import express from 'express';
import {
    addPartner,
    getPartnerSalesHistory,
    getPartnerWithDiscount,
    getPartnersWithDiscount,
    updatePartner,
} from '../services/parnerService.js';
import { logger } from '../config/logger.js';

const router = express.Router();

function handleError(res, error, context) {
    if (error.status === 400) {
        logger.warning(context, error.message);
        return res.status(400).json({ error: error.message });
    }
    logger.error(context, error);
    return res.status(500).json({ error: 'Ошибка сервера при работе с БД' });
}

router.get('/partners', async (req, res) => {
    try {
        const partners = await getPartnersWithDiscount();
        res.json(partners);
    } catch (error) {
        handleError(res, error, 'GET /api/partners');
    }
});

router.get('/partner/:id', async (req, res) => {
    try {
        const partnerId = parseInt(req.params.id, 10);
        const partner = await getPartnerWithDiscount(partnerId);

        if (!partner) {
            return res.status(404).json({ error: 'Партнер не найден' });
        }

        res.json(partner);
    } catch (error) {
        handleError(res, error, 'GET /api/partner/:id');
    }
});

// История отгрузок конкретного партнера: partner_id передается из окна истории
router.get('/partners/:id/sales-history', async (req, res) => {
    try {
        const partnerId = parseInt(req.params.id, 10);

        if (Number.isNaN(partnerId)) {
            return res.status(400).json({ error: 'Некорректный идентификатор партнера' });
        }

        const partner = await getPartnerWithDiscount(partnerId);

        if (!partner) {
            return res.status(404).json({ error: 'Партнер не найден' });
        }

        const history = await getPartnerSalesHistory(partnerId);

        res.json({
            partner_id: partner.partner_id,
            company_name: partner.company_name,
            history,
        });
    } catch (error) {
        handleError(res, error, 'GET /api/partners/:id/sales-history');
    }
});

router.post('/partners', async (req, res) => {
    try {
        const partner = await addPartner(req.body);
        res.status(201).json(partner);
    } catch (error) {
        handleError(res, error, 'POST /api/partners');
    }
});

router.put('/partners/:id', async (req, res) => {
    try {
        const partnerId = parseInt(req.params.id, 10);
        const partner = await updatePartner(partnerId, req.body);

        if (!partner) {
            return res.status(404).json({ error: 'Партнер не найден' });
        }

        res.json(partner);
    } catch (error) {
        handleError(res, error, 'PUT /api/partners/:id');
    }
});

export default router;