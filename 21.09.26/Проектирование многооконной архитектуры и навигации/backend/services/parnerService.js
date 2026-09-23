import pool from '../config/db.js';

export function calculatePartnerDiscount(totalQuantity) {
    const total = Number(totalQuantity) || 0;

    if (total < 10000) {
        return 0;
    }
    if (total < 50000) {
        return 5;
    }
    if (total < 300000) {
        return 10;
    }
    return 15;
}

const PARTNER_SELECT = `
  SELECT
    p.partner_id,
    p.company_name,
    COALESCE(p.phone, '') AS phone,
    COALESCE(p.rating, 0) AS rating,
    COALESCE(SUM(s.quantity), 0) AS "totalQuantity"
  FROM partners p
  LEFT JOIN sales s ON p.partner_id = s.partner_id
`;

const PARTNER_GROUP_ORDER = `
  GROUP BY p.partner_id
  ORDER BY p.partner_id;
`;

function toPartnerDto(row) {
    const totalQuantity = Number(row.totalQuantity) || 0;

    return {
        partner_id: row.partner_id,
        company_name: row.company_name,
        phone: row.phone,
        rating: Number(row.rating) || 0,
        totalQuantity,
        discountPercentage: calculatePartnerDiscount(totalQuantity),
    };
}

export async function getPartnersWithDiscount() {
    const result = await pool.query(`${PARTNER_SELECT}${PARTNER_GROUP_ORDER}`);

    return result.rows.map(toPartnerDto);
}

export async function getPartnerWithDiscount(partnerId) {
    const query = `
    ${PARTNER_SELECT}
    WHERE p.partner_id = $1
    ${PARTNER_GROUP_ORDER}
  `;

    const result = await pool.query(query, [partnerId]);

    if (result.rows.length === 0) {
        return null;
    }

    return toPartnerDto(result.rows[0]);
}