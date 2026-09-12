COPY public.partners (partner_id, company_name, inn, contact_email, phone, rating)
FROM 'file.csv'
WITH (
    FORMAT csv,
    HEADER true,
    DELIMITER ',',
    QUOTE '"',
    ESCAPE '''',
    ENCODING 'UTF8'
);