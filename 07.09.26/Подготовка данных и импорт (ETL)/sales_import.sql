COPY public.sales (sale_id, partner_id, product_id, sale_date, quantity, total_amount)
FROM 'file.csv'
WITH (
    FORMAT csv,
    HEADER true,
    DELIMITER ',',
    QUOTE '"',
    ESCAPE '''',
    ENCODING 'UTF8'
);