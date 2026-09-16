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
    const query = `
    SELECT 
      p.id, 
      p.name, 
      p.email, 
      COALESCE(SUM(s.quantity), 0) AS "totalQuantity"
    FROM partners p
    LEFT JOIN sales_history s ON p.id = s.partner_id
    WHERE p.id = $1
    GROUP BY p.id, p.name, p.email;
  `;

    const result = await pool.query(query, [partnerId]);

    if (result.rows.length === 0) {
        return null;
    }

    const partnerData = result.rows[0];

    const totalVolume = Number(partnerData.totalQuantity);

    const discountPercentage = calculatePartnerDiscount(totalVolume);

    partnerData.discountPercentage = discountPercentage;

    return partnerData;
}
