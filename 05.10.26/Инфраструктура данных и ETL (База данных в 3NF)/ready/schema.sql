-- Скрипт проектирования чистой схемы данных (3NF)

-- Удаление таблиц перед созданием для возможности перезапуска скрипта
DROP TABLE IF EXISTS sales_history CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 1. Справочник партнеров
CREATE TABLE partners (
    partner_id INT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    inn VARCHAR(12) NOT NULL UNIQUE,       -- Ограничение UNIQUE по ТЗ (тип VARCHAR для сохранения ведущих нулей)
    email VARCHAR(150) NOT NULL UNIQUE     -- Ограничение UNIQUE по ТЗ
);

-- 2. Справочник номенклатуры (продуктов)
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL          -- Тип данных DECIMAL для цен по ТЗ
);

-- 3. История реализации (продаж)
CREATE TABLE sales_history (
    sale_id INT PRIMARY KEY,
    partner_id INT NOT NULL,
    product_id INT NOT NULL,
    sale_date DATE NOT NULL,               -- Автоматический стандарт ГГГГ-ММ-ДД
    quantity INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,        -- Тип данных DECIMAL для финансовых сумм
    
    -- Обеспечение ссылочной целостности (FOREIGN KEY)
    CONSTRAINT fk_sales_partner FOREIGN KEY (partner_id) REFERENCES partners(partner_id),
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(product_id)
);