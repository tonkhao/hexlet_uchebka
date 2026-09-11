--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6 (Homebrew)
-- Dumped by pg_dump version 17.5

-- Started on 2026-09-11 13:22:50 MSK

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

ALTER TABLE ONLY public.sales DROP CONSTRAINT "product_id_FK";
ALTER TABLE ONLY public.sales DROP CONSTRAINT "partner_id_FK";
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_pkey;
ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
ALTER TABLE ONLY public.partners DROP CONSTRAINT partners_pkey;
DROP TABLE public.sales;
DROP TABLE public.products;
DROP TABLE public.partners;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 25165)
-- Name: partners; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.partners (
    partner_id bigint NOT NULL,
    company_name character varying NOT NULL,
    contact_email character varying,
    phone character varying,
    rating numeric,
    inn numeric
);


ALTER TABLE public.partners OWNER TO antonkharlamov;

--
-- TOC entry 217 (class 1259 OID 25164)
-- Name: partners_partner_id_seq; Type: SEQUENCE; Schema: public; Owner: antonkharlamov
--

ALTER TABLE public.partners ALTER COLUMN partner_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.partners_partner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 219 (class 1259 OID 25177)
-- Name: products; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.products (
    name character varying,
    price numeric NOT NULL,
    id bigint NOT NULL
);


ALTER TABLE public.products OWNER TO antonkharlamov;

--
-- TOC entry 222 (class 1259 OID 25193)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: antonkharlamov
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 25185)
-- Name: sales; Type: TABLE; Schema: public; Owner: antonkharlamov
--

CREATE TABLE public.sales (
    sale_id bigint NOT NULL,
    partner_id bigint,
    product_id bigint,
    sale_date date,
    quantity bigint,
    total_amount numeric
);


ALTER TABLE public.sales OWNER TO antonkharlamov;

--
-- TOC entry 220 (class 1259 OID 25184)
-- Name: sales_sale_id_seq; Type: SEQUENCE; Schema: public; Owner: antonkharlamov
--

ALTER TABLE public.sales ALTER COLUMN sale_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sales_sale_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3666 (class 2606 OID 25169)
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (partner_id);


--
-- TOC entry 3668 (class 2606 OID 25200)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3670 (class 2606 OID 25189)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (sale_id);


--
-- TOC entry 3671 (class 2606 OID 25206)
-- Name: sales partner_id_FK; Type: FK CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "partner_id_FK" FOREIGN KEY (partner_id) REFERENCES public.partners(partner_id) NOT VALID;


--
-- TOC entry 3672 (class 2606 OID 25201)
-- Name: sales product_id_FK; Type: FK CONSTRAINT; Schema: public; Owner: antonkharlamov
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT "product_id_FK" FOREIGN KEY (product_id) REFERENCES public.products(id) NOT VALID;


-- Completed on 2026-09-11 13:22:50 MSK

--
-- PostgreSQL database dump complete
--

