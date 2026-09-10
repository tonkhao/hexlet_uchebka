--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6 (Homebrew)
-- Dumped by pg_dump version 17.5

-- Started on 2026-09-10 14:52:11 MSK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.shipments DROP CONSTRAINT fk_shipments_partners;
ALTER TABLE ONLY public.shipment_items DROP CONSTRAINT fk_items_shipments;
ALTER TABLE ONLY public.shipment_items DROP CONSTRAINT fk_items_products;
DROP INDEX public.idx_shipments_partner_id;
DROP INDEX public.idx_shipment_items_shipment_id;
ALTER TABLE ONLY public.products DROP CONSTRAINT uq_product_sku;
ALTER TABLE ONLY public.partners DROP CONSTRAINT uq_partner_inn;
ALTER TABLE ONLY public.partners DROP CONSTRAINT uq_partner_email;
ALTER TABLE ONLY public.shipments DROP CONSTRAINT shipments_pkey;
ALTER TABLE ONLY public.shipment_items DROP CONSTRAINT shipment_items_pkey;
ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
ALTER TABLE ONLY public.partners DROP CONSTRAINT partners_pkey;
DROP TABLE public.shipments;
DROP TABLE public.shipment_items;
DROP TABLE public.products;
DROP TABLE public.partners;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 24933)
-- Name: partners; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.partners (
    partner_id uuid NOT NULL,
    company_name character varying(255) NOT NULL,
    inn character varying(12) NOT NULL,
    contact_email character varying(100),
    contact_phone character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.partners OWNER TO antonkharlamov;

--
-- TOC entry 218 (class 1259 OID 24943)
-- Name: products; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.products (
    product_id uuid NOT NULL,
    sku character varying(50) NOT NULL,
    product_name character varying(255) NOT NULL,
    current_price numeric(10,2) NOT NULL,
    CONSTRAINT chk_current_price_positive CHECK ((current_price >= (0)::numeric))
);


ALTER TABLE public.products OWNER TO antonkharlamov;

--
-- TOC entry 220 (class 1259 OID 24961)
-- Name: shipment_items; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.shipment_items (
    shipment_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    price_at_shipment numeric(10,2) NOT NULL,
    CONSTRAINT chk_price_positive CHECK ((price_at_shipment >= (0)::numeric)),
    CONSTRAINT chk_quantity_positive CHECK ((quantity > 0))
);


ALTER TABLE public.shipment_items OWNER TO antonkharlamov;

--
-- TOC entry 219 (class 1259 OID 24951)
-- Name: shipments; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.shipments (
    shipment_id uuid NOT NULL,
    partner_id uuid NOT NULL,
    shipment_date timestamp without time zone NOT NULL,
    status character varying(50) NOT NULL
);


ALTER TABLE public.shipments OWNER TO antonkharlamov;

--
-- TOC entry 3834 (class 0 OID 24933)
-- Dependencies: 217
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: antonkharlamov
--

INSERT INTO public.partners VALUES ('00000000-0000-0000-0000-000000000001', 'ООО "Логистик-Экспресс"', '7701234567', 'info@logex.ru', '+7 (999) 111-22-33', true);
INSERT INTO public.partners VALUES ('00000000-0000-0000-0000-000000000002', 'ИП Петров А.В.', '5001098765', 'petrov_delivery@mail.ru', 'Не указан', true);
INSERT INTO public.partners VALUES ('00000000-0000-0000-0000-000000000003', 'ТК "Быстрый Путь"', '7812345678', 'speedway@yandex.ru', '+78125554433', true);
INSERT INTO public.partners VALUES ('00000000-0000-0000-0000-000000000004', 'Неизвестный партнер (Аномалия FK)', '000000000000', 'unknown@partner.ru', 'Не указан', true);


--
-- TOC entry 3835 (class 0 OID 24943)
-- Dependencies: 218
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: antonkharlamov
--

INSERT INTO public.products VALUES ('00000000-0000-0000-0000-000000000101', 'SKU-ALFA', 'Стиральный порошок "Альфа"', 500.00);
INSERT INTO public.products VALUES ('00000000-0000-0000-0000-000000000102', 'SKU-SOAP', 'Мыло жидкое "Стандарт"', 90.00);
INSERT INTO public.products VALUES ('00000000-0000-0000-0000-000000000103', 'SKU-COND', 'Кондиционер для белья', 350.00);


--
-- TOC entry 3837 (class 0 OID 24961)
-- Dependencies: 220
-- Data for Name: shipment_items; Type: TABLE DATA; Schema: public; Owner: antonkharlamov
--

INSERT INTO public.shipment_items VALUES ('00000000-0000-0000-0000-000000010101', '00000000-0000-0000-0000-000000000101', 50, 500.00);
INSERT INTO public.shipment_items VALUES ('00000000-0000-0000-0000-000000010102', '00000000-0000-0000-0000-000000000102', 200, 90.00);
INSERT INTO public.shipment_items VALUES ('00000000-0000-0000-0000-000000010103', '00000000-0000-0000-0000-000000000103', 30, 350.00);
INSERT INTO public.shipment_items VALUES ('00000000-0000-0000-0000-000000010104', '00000000-0000-0000-0000-000000000101', 10, 500.00);
INSERT INTO public.shipment_items VALUES ('00000000-0000-0000-0000-000000010105', '00000000-0000-0000-0000-000000000102', 150, 90.00);


--
-- TOC entry 3836 (class 0 OID 24951)
-- Dependencies: 219
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: antonkharlamov
--

INSERT INTO public.shipments VALUES ('00000000-0000-0000-0000-000000010101', '00000000-0000-0000-0000-000000000001', '2026-03-01 00:00:00', 'Доставлено');
INSERT INTO public.shipments VALUES ('00000000-0000-0000-0000-000000010102', '00000000-0000-0000-0000-000000000002', '2026-03-15 00:00:00', 'Доставлено');
INSERT INTO public.shipments VALUES ('00000000-0000-0000-0000-000000010103', '00000000-0000-0000-0000-000000000001', '2026-03-20 00:00:00', 'Доставлено');
INSERT INTO public.shipments VALUES ('00000000-0000-0000-0000-000000010104', '00000000-0000-0000-0000-000000000004', '2026-03-22 00:00:00', 'Доставлено');
INSERT INTO public.shipments VALUES ('00000000-0000-0000-0000-000000010105', '00000000-0000-0000-0000-000000000003', '2026-03-25 00:00:00', 'Доставлено');


--
-- TOC entry 3671 (class 2606 OID 24938)
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (partner_id);


--
-- TOC entry 3677 (class 2606 OID 24948)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 3685 (class 2606 OID 24967)
-- Name: shipment_items shipment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT shipment_items_pkey PRIMARY KEY (shipment_id, product_id);


--
-- TOC entry 3682 (class 2606 OID 24955)
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (shipment_id);


--
-- TOC entry 3673 (class 2606 OID 24942)
-- Name: partners uq_partner_email; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT uq_partner_email UNIQUE (contact_email);


--
-- TOC entry 3675 (class 2606 OID 24940)
-- Name: partners uq_partner_inn; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT uq_partner_inn UNIQUE (inn);


--
-- TOC entry 3679 (class 2606 OID 24950)
-- Name: products uq_product_sku; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_product_sku UNIQUE (sku);


--
-- TOC entry 3683 (class 1259 OID 24979)
-- Name: idx_shipment_items_shipment_id; Type: INDEX; Schema: public; Owner: antonkharlamov
--

CREATE INDEX idx_shipment_items_shipment_id ON public.shipment_items USING btree (shipment_id);


--
-- TOC entry 3680 (class 1259 OID 24978)
-- Name: idx_shipments_partner_id; Type: INDEX; Schema: public; Owner: antonkharlamov
--

CREATE INDEX idx_shipments_partner_id ON public.shipments USING btree (partner_id);


--
-- TOC entry 3687 (class 2606 OID 24973)
-- Name: shipment_items fk_items_products; Type: FK CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT fk_items_products FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE RESTRICT;


--
-- TOC entry 3688 (class 2606 OID 24968)
-- Name: shipment_items fk_items_shipments; Type: FK CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT fk_items_shipments FOREIGN KEY (shipment_id) REFERENCES public.shipments(shipment_id) ON DELETE CASCADE;


--
-- TOC entry 3686 (class 2606 OID 24956)
-- Name: shipments fk_shipments_partners; Type: FK CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT fk_shipments_partners FOREIGN KEY (partner_id) REFERENCES public.partners(partner_id) ON DELETE RESTRICT;


-- Completed on 2026-09-10 14:52:11 MSK

--
-- PostgreSQL database dump complete
--

