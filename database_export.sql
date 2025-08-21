--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_configurations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_configurations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    provider character varying NOT NULL,
    model_name character varying NOT NULL,
    api_key text,
    endpoint character varying,
    configuration jsonb,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_configurations OWNER TO neondb_owner;

--
-- Name: email_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    email character varying NOT NULL,
    provider character varying NOT NULL,
    access_token text,
    refresh_token text,
    imap_config jsonb,
    is_active boolean DEFAULT true,
    last_checked timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_accounts OWNER TO neondb_owner;

--
-- Name: erp_systems; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.erp_systems (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    endpoint character varying NOT NULL,
    credentials jsonb,
    is_active boolean DEFAULT true,
    last_sync timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.erp_systems OWNER TO neondb_owner;

--
-- Name: extracted_po_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.extracted_po_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    email_account_id character varying NOT NULL,
    email_subject character varying,
    email_from character varying,
    email_date timestamp without time zone,
    po_number character varying,
    supplier character varying,
    buyer character varying,
    date timestamp without time zone,
    amount numeric(12,2),
    currency character varying DEFAULT 'USD'::character varying,
    line_items jsonb,
    attachment_name character varying,
    extracted_text text,
    llm_response jsonb,
    processing_status character varying DEFAULT 'completed'::character varying,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.extracted_po_data OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying,
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    related_entity character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: oauth_configurations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth_configurations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    provider character varying NOT NULL,
    client_id character varying NOT NULL,
    client_secret character varying NOT NULL,
    redirect_uri character varying NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.oauth_configurations OWNER TO neondb_owner;

--
-- Name: processing_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.processing_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    purchase_order_id character varying,
    stage character varying NOT NULL,
    status character varying NOT NULL,
    start_time timestamp without time zone DEFAULT now(),
    end_time timestamp without time zone,
    duration integer,
    details jsonb,
    error_message text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.processing_logs OWNER TO neondb_owner;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    po_number character varying NOT NULL,
    vendor_name character varying NOT NULL,
    vendor_address text,
    total_amount numeric(12,2),
    currency character varying DEFAULT 'USD'::character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    email_source character varying,
    original_email jsonb,
    extracted_data jsonb,
    validation_results jsonb,
    erp_push_result jsonb,
    failure_reason text,
    human_review_required boolean DEFAULT false,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.purchase_orders OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    plan character varying DEFAULT 'enterprise'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    tenant_id character varying NOT NULL,
    role character varying DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vendors (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    name character varying NOT NULL,
    alternate_names jsonb,
    address text,
    tax_id character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vendors OWNER TO neondb_owner;

--
-- Data for Name: ai_configurations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_configurations (id, tenant_id, provider, model_name, api_key, endpoint, configuration, is_active, created_at, updated_at) FROM stdin;
850dd09f-9f25-4340-bede-b9b7ceeb47f9	default-tenant-1	openai	gpt-4o	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	\N	\N	t	2025-08-21 11:32:00.261207	2025-08-21 11:32:17.160693
\.


--
-- Data for Name: email_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_accounts (id, tenant_id, email, provider, access_token, refresh_token, imap_config, is_active, last_checked, created_at, updated_at) FROM stdin;
f1a70719-6974-4141-b233-c2d98825ac5d	default-tenant-1	chavannishanthrao@gmail.com	gmail	ya29.A0AS3H6Ny9TIVkEVolffaUI0DbdFB9Cb06-mRefiQ6VveyW1rp1WE5QI8IHar53o58L1tbSVj0wKr2psiQvSjJlWrEIUs6I0yCWlXsjqXFnig2jMc21YROrRmwFOEHchkazYtINYGPkeHckoEhVJjro8RxIN2odcA3Kfq1ud_LHoEhDe1ZMiOLnZzlfc5ik_TC-sy7cC4aCgYKAbsSARcSFQHGX2MiTGNyENwsT_DAmBblcxauWg0206	1//06hRHeUzvXhk9CgYIARAAGAYSNwF-L9IrN89t1F7wQYyyExIQ7uOGq-HKF53t5UZVyjajNqn7yZbx_b6UEyvbCpRnU7vdOne34Bw	\N	t	2025-08-21 11:44:57.558	2025-08-21 11:15:45.061499	2025-08-21 11:44:57.566733
\.


--
-- Data for Name: erp_systems; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.erp_systems (id, tenant_id, name, type, endpoint, credentials, is_active, last_sync, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: extracted_po_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.extracted_po_data (id, tenant_id, user_id, email_account_id, email_subject, email_from, email_date, po_number, supplier, buyer, date, amount, currency, line_items, attachment_name, extracted_text, llm_response, processing_status, error_message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, tenant_id, user_id, type, title, message, is_read, related_entity, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_configurations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth_configurations (id, tenant_id, provider, client_id, client_secret, redirect_uri, scopes, is_active, created_at, updated_at) FROM stdin;
b0863f89-7c26-41ee-ab96-6f5bc92d02d4	default-tenant-1	gmail	87064819703-vftbl8onphjsklcbbiqnr73cb5osoici.apps.googleusercontent.com	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	https://2b6e422d-342b-4100-bc94-242e0a6f6f16-00-3ui9v7tegr4xg.spock.replit.dev/api/auth/gmail/callback	{}	t	2025-08-21 10:25:33.606663	2025-08-21 10:44:20.94892
f465e7fb-2fa3-4122-b342-e76512a3d73f	default-tenant-1	microsoft	595a854c-fcb7-4a0a-b455-e43c53be19be	qPZ8Q~H_IOL7d58idpj7b093d~VLlbHPcQeOTbLM	https://2b6e422d-342b-4100-bc94-242e0a6f6f16-00-3ui9v7tegr4xg.spock.replit.dev/api/auth/microsoft/callback	{}	t	2025-08-21 08:58:20.144108	2025-08-21 10:44:23.379965
\.


--
-- Data for Name: processing_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.processing_logs (id, tenant_id, purchase_order_id, stage, status, start_time, end_time, duration, details, error_message, created_at) FROM stdin;
c9b98a31-2b03-4f00-9699-6eab47b137b8	default-tenant-1	\N	email_detection	failed	2025-08-21 11:21:38.722804	\N	\N	\N	Failed to process emails: The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined	2025-08-21 11:21:38.722804
698292e5-07f7-4c38-a983-ef0e98cab6cc	default-tenant-1	\N	email_detection	failed	2025-08-21 11:22:54.398947	\N	\N	\N	Failed to process emails: Unexpected token 'y', "ya29.A0AS3"... is not valid JSON	2025-08-21 11:22:54.398947
066fdeca-c9fe-4548-a146-8e4562f950ee	default-tenant-1	\N	email_detection	failed	2025-08-21 11:49:52.610478	\N	\N	\N	Failed to process emails: response is not defined	2025-08-21 11:49:52.610478
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_orders (id, tenant_id, po_number, vendor_name, vendor_address, total_amount, currency, status, email_source, original_email, extracted_data, validation_results, erp_push_result, failure_reason, human_review_required, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
zsV7WFpMp8BadCA0iaKwEn-AcJK9Z7jx	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-22T11:15:45.090Z", "httpOnly": true, "originalMaxAge": 86400000}, "passport": {"user": "6a6f52a4-7b44-420f-b846-a82a6335eaee"}}	2025-08-22 11:48:08
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (id, name, plan, created_at, updated_at) FROM stdin;
default-tenant-1	Default Organization	enterprise	2025-08-21 07:31:58.781618	2025-08-21 07:31:58.781618
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, first_name, last_name, profile_image_url, tenant_id, role, created_at, updated_at) FROM stdin;
6a6f52a4-7b44-420f-b846-a82a6335eaee	chavanv@dotsolved.com	b0102256a04a1d80e2e2e6c8bb7e18ac4ebe0850c41e12ace9b48fe31f1793b475fa2ba90b0665db28b8f12cd889f3a2fa55a4cad2151cb92d28ecd0bf0a5027.d85caddedd16c8ce371f8ca1d4cf97c3	Chavan	V	\N	default-tenant-1	admin	2025-08-21 07:32:12.735358	2025-08-21 07:32:12.735358
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vendors (id, tenant_id, name, alternate_names, address, tax_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: ai_configurations ai_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_configurations
    ADD CONSTRAINT ai_configurations_pkey PRIMARY KEY (id);


--
-- Name: email_accounts email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_pkey PRIMARY KEY (id);


--
-- Name: erp_systems erp_systems_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.erp_systems
    ADD CONSTRAINT erp_systems_pkey PRIMARY KEY (id);


--
-- Name: extracted_po_data extracted_po_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.extracted_po_data
    ADD CONSTRAINT extracted_po_data_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_configurations oauth_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth_configurations
    ADD CONSTRAINT oauth_configurations_pkey PRIMARY KEY (id);


--
-- Name: processing_logs processing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.processing_logs
    ADD CONSTRAINT processing_logs_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_email_accounts_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_accounts_tenant_id ON public.email_accounts USING btree (tenant_id);


--
-- Name: idx_erp_systems_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_erp_systems_tenant_id ON public.erp_systems USING btree (tenant_id);


--
-- Name: idx_extracted_po_data_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_extracted_po_data_tenant_id ON public.extracted_po_data USING btree (tenant_id);


--
-- Name: idx_notifications_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_tenant_id ON public.notifications USING btree (tenant_id);


--
-- Name: idx_notifications_user_id_is_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user_id_is_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_oauth_configurations_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_oauth_configurations_tenant_id ON public.oauth_configurations USING btree (tenant_id);


--
-- Name: idx_processing_logs_purchase_order_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_processing_logs_purchase_order_id ON public.processing_logs USING btree (purchase_order_id);


--
-- Name: idx_processing_logs_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_processing_logs_tenant_id ON public.processing_logs USING btree (tenant_id);


--
-- Name: idx_purchase_orders_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_purchase_orders_created_at ON public.purchase_orders USING btree (created_at);


--
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- Name: idx_purchase_orders_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_purchase_orders_tenant_id ON public.purchase_orders USING btree (tenant_id);


--
-- Name: idx_sessions_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);


--
-- Name: idx_users_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: idx_vendors_tenant_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_vendors_tenant_id ON public.vendors USING btree (tenant_id);


--
-- Name: ai_configurations update_ai_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_ai_configurations_updated_at BEFORE UPDATE ON public.ai_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_accounts update_email_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: erp_systems update_erp_systems_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_erp_systems_updated_at BEFORE UPDATE ON public.erp_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: extracted_po_data update_extracted_po_data_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_extracted_po_data_updated_at BEFORE UPDATE ON public.extracted_po_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: oauth_configurations update_oauth_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_oauth_configurations_updated_at BEFORE UPDATE ON public.oauth_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: purchase_orders update_purchase_orders_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendors update_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

