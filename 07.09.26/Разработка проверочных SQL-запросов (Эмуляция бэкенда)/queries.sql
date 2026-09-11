-- ============================================================================
-- ЗАПРОС 1: Список партнеров с общим количеством сделанных доставок
-- ============================================================================
-- Использует LEFT JOIN, чтобы в списке остались партнеры, у которых еще нет продаж.
-- Группировка (GROUP BY) собирает данные, а COUNT считает только реальные доставки.
SELECT 
    partners.partner_id,
    partners.company_name,
    COUNT(sales.sale_id) AS total_shipments
FROM public.partners
LEFT JOIN public.sales ON partners.partner_id = sales.partner_id
GROUP BY partners.partner_id, partners.company_name
ORDER BY partners.company_name ASC;


-- ============================================================================
-- ЗАПРОС 2: Демонстрация транзакции (Добавление партнера и его первой доставки)
-- ============================================================================
-- Так как в бд для id стоит GENERATED ALWAYS, мы не пишем partner_id и sale_id руками.
-- Вместо этого мы используем RETURNING, чтобы динамически перебросить новый ID в продажи.
BEGIN;

-- Шаг 1: Создаем нового партнера и забираем его сгенерированный ID в переменную
WITH new_partner AS (
    INSERT INTO public.partners (company_name, contact_email, phone, rating, inn)
    VALUES ('ТК "Новые Горизонты"', 'contact@newhorizons.ru', '+7 (999) 000-11-22', 5.0, 7702999888)
    RETURNING partner_id
)
-- Шаг 2: Записываем первую тестовую доставку (мыло жидкое "Стандарт", id = 2)
INSERT INTO public.sales (partner_id, product_id, sale_date, quantity, total_amount)
SELECT 
    new_partner.partner_id, 
    2,                -- product_id (Мыло жидкое "Стандарт")
    '2026-09-11',     -- Текущая дата отгрузки
    10,               -- Количество в штуках
    900.00            -- Итоговая сумма (10 шт * 90 руб)
FROM new_partner;

COMMIT;


-- ============================================================================
-- ЗАПРОС 3: История реализации партнера за указанный период
-- ============================================================================
-- Выводит детальную информацию по отгрузкам конкретного партнера (например, id = 1)
-- за заданный промежуток времени с названиями продуктов.
SELECT 
    sales.sale_id,
    partners.company_name,
    products.name AS product_name,
    sales.sale_date,
    sales.quantity,
    sales.total_amount
FROM public.sales
JOIN public.partners ON sales.partner_id = partners.partner_id
JOIN public.products ON sales.product_id = products.id
WHERE sales.partner_id = 1 -- ID искомого партнера (можно менять)
  AND sales.sale_date BETWEEN '2026-03-01' AND '2026-03-21' -- Период дат
ORDER BY sales.sale_date DESC;
