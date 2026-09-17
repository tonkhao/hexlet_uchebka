import pool from '../config/db.js';

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

export async function getPartnerWithDiscount(partnerId) {
    // Выбираем только partner_id и сумму, чтобы не зависеть от полей name/email
    const query = `
    SELECT 
      p.partner_id, 
      COALESCE(SUM(s.quantity), 0) AS "totalQuantity"
    FROM partners p
    LEFT JOIN sales s ON p.partner_id = s.partner_id
    WHERE p.partner_id = $1
    GROUP BY p.partner_id;
  `;

    const result = await pool.query(query, [partnerId]);

    if (result.rows.length === 0) {
        return null;
    }

    // Получаем строку из результатов (индекс 0)
    const partnerData = result.rows[0];

    const totalVolume = Number(partnerData.totalQuantity);

    const discountPercentage = calculatePartnerDiscount(totalVolume);

    partnerData.discountPercentage = discountPercentage;

    return partnerData;
}



