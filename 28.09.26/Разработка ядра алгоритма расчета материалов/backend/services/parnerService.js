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
    p.partner_type_id,
    p.rating,
    p.legal_address,
    p.director_name,
    COALESCE(p.contact_email, '') AS email,
    COALESCE(p.phone, '') AS phone,
    COALESCE(pt.partner_type_name, '') AS partner_type,
    COALESCE(SUM(s.quantity), 0) AS "totalQuantity"
  FROM partners p
  LEFT JOIN partner_types pt ON p.partner_type_id = pt.partner_type_id
  LEFT JOIN sales s ON p.partner_id = s.partner_id
`;

const PARTNER_GROUP_ORDER = `
  GROUP BY p.partner_id, pt.partner_type_name
  ORDER BY p.partner_id;
`;

function toPartnerDto(row) {
    const totalQuantity = Number(row.totalQuantity) || 0;

    return {
        partner_id: row.partner_id,
        company_name: row.company_name,
        partner_type: row.partner_type,
        phone: row.phone,
        rating: Number(row.rating) || 0,
        address: row.legal_address ?? '',
        director: row.director_name ?? '',
        email: row.email,
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

// История реализации продукции партнером: JOIN sales -> products.
// Дата приводится к DD.MM.YYYY на стороне БД, чтобы в интерфейс
// попадала строка, готовая к показу менеджеру без дополнительного форматирования.
export async function getPartnerSalesHistory(partnerId) {
    const query = `
    SELECT
        s.sale_id,
        COALESCE(pr.name, '') AS product_name,
        COALESCE(s.quantity, 0) AS quantity,
        TO_CHAR(s.sale_date, 'DD.MM.YYYY') AS sale_date
    FROM sales s
    JOIN partners p ON p.partner_id = s.partner_id
    JOIN products pr ON pr.id = s.product_id
    WHERE p.partner_id = $1
    ORDER BY s.sale_date DESC, s.sale_id DESC;
  `;

    const result = await pool.query(query, [partnerId]);

    return result.rows.map(row => ({
        sale_id: row.sale_id,
        product_name: row.product_name,
        quantity: Number(row.quantity) || 0,
        sale_date: row.sale_date ?? '',
    }));
}

// Ссылочная целостность на уровне кода: тип партнера ищется в справочнике
// partner_types, и только существующее значение допускается для сохранения
async function resolvePartnerTypeId(partnerTypeName) {
    const result = await pool.query(
        'SELECT partner_type_id FROM partner_types WHERE partner_type_name = $1',
        [partnerTypeName],
    );

    return result.rows.length > 0 ? result.rows[0].partner_type_id : null;
}

function typeNotFoundError(name) {
    const error = new Error(`Тип партнера "${name}" не существует в справочнике`);
    error.status = 400;
    return error;
}

function normalizeNullable(value) {
    return (value === undefined || value === null || value === '') ? null : value;
}

export async function addPartner(partnerData) {
    const {
        company_name, partner_type, rating, legal_address, director_name, contact_email, phone,
    } = partnerData;

    const partnerTypeId = await resolvePartnerTypeId(partner_type);
    if (!partnerTypeId) {
        throw typeNotFoundError(partner_type);
    }

    const result = await pool.query(
        `INSERT INTO partners
            (company_name, partner_type_id, rating, legal_address, director_name, contact_email, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING partner_id`,
        [
            company_name,
            partnerTypeId,
            rating,
            normalizeNullable(legal_address),
            normalizeNullable(director_name),
            normalizeNullable(contact_email),
            normalizeNullable(phone),
        ],
    );

    return getPartnerWithDiscount(result.rows[0].partner_id);
}

export async function updatePartner(partnerId, partnerData) {
    const {
        partner_type, rating, legal_address, director_name, contact_email, phone, company_name,
    } = partnerData;

    const partnerTypeId = await resolvePartnerTypeId(partner_type);
    if (!partnerTypeId) {
        throw typeNotFoundError(partner_type);
    }

    const result = await pool.query(
        `UPDATE partners SET
            company_name = $1,
            partner_type_id = $2,
            rating = $3,
            legal_address = $4,
            director_name = $5,
            contact_email = $6,
            phone = $7
         WHERE partner_id = $8
         RETURNING partner_id`,
        [
            company_name,
            partnerTypeId,
            rating,
            normalizeNullable(legal_address),
            normalizeNullable(director_name),
            normalizeNullable(contact_email),
            normalizeNullable(phone),
            partnerId,
        ],
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getPartnerWithDiscount(partnerId);
}