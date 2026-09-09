-- ============================================================================
-- Скрипт развертывания структуры БД (schema.sql)
-- Проектирование в 3-й нормальной форме (3NF) на UUID-идентификаторах
-- СУБД: PostgreSQL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. УДАЛЕНИЕ ТАБЛИЦ (с учетом строгого порядка зависимостей внешних ключей)
-- ----------------------------------------------------------------------------
-- Сначала удаляем промежуточную таблицу связей, затем документы, 
-- и только в конце — таблицы-справочники.
DROP TABLE IF EXISTS shipment_items CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS partners CASCADE;


-- ----------------------------------------------------------------------------
-- 2. СОЗДАНИЕ ТАБЛИЦ И ОГРАНИЧЕНИЙ ЦЕЛОСТНОСТИ
-- ----------------------------------------------------------------------------

-- Сущность 1: Партнеры (Контрагенты)
CREATE TABLE partners (
    partner_id     UUID PRIMARY KEY,                                      -- Первичный ключ (PK)
    company_name   CHARACTER VARYING(255) NOT NULL,                       -- Ограничение NOT NULL
    inn            CHARACTER VARYING(12) NOT NULL CONSTRAINT uq_partner_inn UNIQUE,   -- Ограничение UNIQUE
    contact_email  CHARACTER VARYING(100) CONSTRAINT uq_partner_email UNIQUE,         -- Ограничение UNIQUE
    contact_phone  CHARACTER VARYING(20) NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Сущность 2: Товары (Каталог продукции)
CREATE TABLE products (
    product_id     UUID PRIMARY KEY,                                      -- Первичный ключ (PK)
    sku            CHARACTER VARYING(50) NOT NULL CONSTRAINT uq_product_sku UNIQUE,   -- Ограничение UNIQUE
    product_name   CHARACTER VARYING(255) NOT NULL,
    current_price  NUMERIC(10,2) NOT NULL CONSTRAINT chk_current_price_positive CHECK (current_price >= 0) -- DECIMAL тип
);

-- Сущность 3: Документы отгрузок (Шапки накладных)
CREATE TABLE shipments (
    shipment_id    UUID PRIMARY KEY,                                      -- Первичный ключ (PK)
    partner_id     UUID NOT NULL,                                         -- Внешний ключ (FK) на UUID
    shipment_date  TIMESTAMP WITHOUT TIME ZONE NOT NULL,                  -- Тип DATE/TIMESTAMP
    status         CHARACTER VARYING(50) NOT NULL,
    
    -- Ограничение целостности: запрет удаления контрагента, если по нему есть история отгрузок
    CONSTRAINT fk_shipments_partners 
        FOREIGN KEY (partner_id) 
        REFERENCES partners (partner_id) 
        ON DELETE RESTRICT
);

-- Сущность 4: Позиции отгрузки (Реализация связи многие-ко-многим для обеспечения 3NF)
CREATE TABLE shipment_items (
    shipment_id       UUID NOT NULL,                                      -- Композитный PK / FK на UUID
    product_id        UUID NOT NULL,                                      -- Композитный PK / FK на UUID
    quantity          INTEGER NOT NULL,                                   -- Тип INT
    price_at_shipment NUMERIC(10,2) NOT NULL,                             -- Историческая цена (DECIMAL)
    
    -- Составной первичный ключ (Обеспечивает уникальность товара в рамках одной накладной)
    PRIMARY KEY (shipment_id, product_id),
    
    -- Бизнес-валидация значений на уровне СУБД
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_price_positive CHECK (price_at_shipment >= 0),
    
    -- Ограничение целостности: каскадное удаление строк накладной при удалении самой накладной
    CONSTRAINT fk_items_shipments 
        FOREIGN KEY (shipment_id) 
        REFERENCES shipments (shipment_id) 
        ON DELETE CASCADE,
        
    -- Ограничение целостности: запрет удаления товара из каталога, если он уже фигурирует в отгрузках
    CONSTRAINT fk_items_products 
        FOREIGN KEY (product_id) 
        REFERENCES products (product_id) 
        ON DELETE RESTRICT
);


-- ----------------------------------------------------------------------------
-- 3. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ (Повышение скорости работы выборок истории)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_shipments_partner_id ON shipments (partner_id);
CREATE INDEX idx_shipment_items_shipment_id ON shipment_items (shipment_id);