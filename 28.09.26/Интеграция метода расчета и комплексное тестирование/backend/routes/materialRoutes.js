import express from 'express';
import { calculateMaterialRequirementDetailed } from '../services/materialService.js';

const router = express.Router();

// Приводит тело запроса к числам. JSON-числа уже приходят числами,
// но строки и пустые значения приводятся к null, чтобы валидация
// в сервисе вернула -1, а не считала мусор за 0.
function toNumberOrNull(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

// POST /api/materials/calculate
// Тело: { product_type_id, material_type_id, quantity, param_1, param_2 }
// Ответ: 200 с расчетом либо 400, если метод вернул -1
router.post('/materials/calculate', async (req, res) => {
    try {
        const input = {
            product_type_id: toNumberOrNull(req.body?.product_type_id),
            material_type_id: toNumberOrNull(req.body?.material_type_id),
            quantity: toNumberOrNull(req.body?.quantity),
            param_1: toNumberOrNull(req.body?.param_1),
            param_2: toNumberOrNull(req.body?.param_2),
        };

        const calculation = await calculateMaterialRequirementDetailed(input);

        if (!calculation.ok) {
            return res.status(400).json({
                result: calculation.result,
                error: calculation.error,
            });
        }

        res.json(calculation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при расчете материалов' });
    }
});

export default router;
