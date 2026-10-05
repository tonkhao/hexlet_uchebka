-- Скрипт импорта и очистки данных (ETL)

-- 1. Создание временных staging-таблиц для загрузки сырых текстовых данных
CREATE TEMP TABLE staging_partners (partner_id TEXT, partner_name TEXT, inn TEXT, email TEXT);
CREATE TEMP TABLE staging_products (product_id TEXT, product_name TEXT, price TEXT);
CREATE TEMP TABLE staging_sales_history (sale_id TEXT, partner_id TEXT, product_id TEXT, sale_date TEXT, quantity TEXT, amount TEXT);

-- 2. Сырая вставка данных из предоставленных файлов заказчика (имитация загрузки из .csv)
INSERT INTO staging_partners VALUES
(1, ' ООО ""Вектор"" ', '7701234567', ' vector@mail.ru'),
(2, 'ИП ...Петров  A.B.', '7802345678', 'petrov@yandex.ru '),
(3, 'АО "Технолоджис"', '5003456789', 'info@techno.ru'),
(4, '  ООО ""Альфа"" ', '7704567890', '  alpha@gmail.com'),
(5, 'ИП Сидоров И.И.', '7805678901', 'sidorov@llc.ru');

INSERT INTO staging_products VALUES
(101, ' Ноутбук Pro ', '75000.0'),
(102, ' Смартфон X ', '45000.5'),
(103, 'Монитор 27"', '18200.0');

INSERT INTO staging_sales_history VALUES
(1001, '1', '101', '25.10.2023', '2', '150000.0'),
(1002, '2', '102', '2023/10/26', '1', '45000.5'),
(1003, '999', '101', '2023-10-27', '5', '375000.0'), -- Аномалия: битый внешний ключ
(1004, '4', '103', '28-10-2023', '10', '182000.0'),
(1005, '3', '102', '2023.10.29', '3', '135001.5'),   -- Аномалия: формат даты с точками YYYY.MM.DD
(1006, '5', '103', ' 2023-10-30 ', '1', '18200.0');


-- 3. ETL: Очистка и перенос данных в целевую схему 3NF

-- Очистка партнеров (усечение лишних пробелов функцией TRIM)
INSERT INTO public.partners (partner_id, company_name, inn, email)
SELECT CAST(TRIM(partner_id) AS INT), TRIM(partner_name), TRIM(inn), TRIM(email)
FROM staging_partners;

-- Очистка продуктов
INSERT INTO public.products (product_id, product_name, price)
SELECT CAST(TRIM(product_id) AS INT), TRIM(product_name), CAST(TRIM(price) AS DECIMAL(15,2))
FROM staging_products;

-- Очистка истории продаж (нормализация всех форматов дат и устранение битых ключей)
INSERT INTO public.sales_history (sale_id, partner_id, product_id, sale_date, quantity, amount)
SELECT 
    CAST(TRIM(sale_id) AS INT),
    CAST(TRIM(partner_id) AS INT),
    CAST(TRIM(product_id) AS INT),
    CASE 
        -- Нормализация формата ГГГГ.ММ.ДД (исправление аномалии с точками)
        WHEN TRIM(sale_date) LIKE '____.__.__' THEN to_date(TRIM(sale_date), 'YYYY.MM.DD')
        -- Нормализация формата ДД.ММ.ГГГГ
        WHEN TRIM(sale_date) LIKE '__.__.____' THEN to_date(TRIM(sale_date), 'DD.MM.YYYY')
        -- Нормализация формата ГГГГ/ММ/ДД
        WHEN TRIM(sale_date) LIKE '%/%/%' THEN to_date(TRIM(sale_date), 'YYYY/MM/DD')
        -- Нормализация формата ГГГГ-ММ-ДД
        WHEN TRIM(sale_date) LIKE '%-%-%' AND TRIM(sale_date) SIMILAR TO '[0-9]{4}-%' THEN to_date(TRIM(sale_date), 'YYYY-MM-DD')
        -- Все остальные форматы (например, ДД-ММ-ГГГГ)
        ELSE to_date(TRIM(sale_date), 'DD-MM-YYYY')
    END,
    CAST(TRIM(quantity) AS INT),
    CAST(TRIM(amount) AS DECIMAL(15,2))
FROM staging_sales_history sh
-- Устранение строки с несуществующим ID партнера (проверка ссылочной целостности):
WHERE EXISTS (SELECT 1 FROM public.partners p WHERE p.partner_id = CAST(TRIM(sh.partner_id) AS INT))
  AND EXISTS (SELECT 1 FROM public.products pr WHERE pr.product_id = CAST(TRIM(sh.product_id) AS INT));

-- 4. Очистка временных структур
DROP TABLE IF EXISTS staging_partners;
DROP TABLE IF EXISTS staging_products;
DROP TABLE IF EXISTS staging_sales_history;