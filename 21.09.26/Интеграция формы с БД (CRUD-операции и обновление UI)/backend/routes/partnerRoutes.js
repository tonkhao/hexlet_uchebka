import express from 'express';
import {
    addPartner,
    getPartnerWithDiscount,
    getPartnersWithDiscount,
    updatePartner,
} from '../services/parnerService.js';

const router = express.Router();

function handleError(res, error) {
    if (error.status === 400) {
        return res.status(400).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: 'Ошибка сервера при работе с БД' });
}

router.get('/partners', async (req, res) => {
    try {
        const partners = await getPartnersWithDiscount();
        res.json(partners);
    } catch (error) {
        handleError(res, error);
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
        handleError(res, error);
    }
});

router.post('/partners', async (req, res) => {
    try {
        const partner = await addPartner(req.body);
        res.status(201).json(partner);
    } catch (error) {
        handleError(res, error);
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
        handleError(res, error);
    }
});

export default router;