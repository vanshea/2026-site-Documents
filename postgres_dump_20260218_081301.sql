--
-- PostgreSQL database dump
--

\restrict DQNhoe3zRSaN5kLy3RfIIz3Ark0hg5SsGRcj83gRUhoqWmfFv5q5BnoSaQszZTu

-- Dumped from database version 18.2 (Postgres.app)
-- Dumped by pg_dump version 18.2 (Postgres.app)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: DailyAggregate; Type: TABLE; Schema: public; Owner: vansedita
--

CREATE TABLE public."DailyAggregate" (
    id bigint NOT NULL,
    day date NOT NULL,
    bucket character varying(64) NOT NULL,
    metric character varying(64) NOT NULL,
    dimension character varying(160),
    value double precision NOT NULL,
    "uniqueUsers" integer,
    sessions integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyAggregate" OWNER TO vansedita;

--
-- Name: DailyAggregate_id_seq; Type: SEQUENCE; Schema: public; Owner: vansedita
--

CREATE SEQUENCE public."DailyAggregate_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DailyAggregate_id_seq" OWNER TO vansedita;

--
-- Name: DailyAggregate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vansedita
--

ALTER SEQUENCE public."DailyAggregate_id_seq" OWNED BY public."DailyAggregate".id;


--
-- Name: Event; Type: TABLE; Schema: public; Owner: vansedita
--

CREATE TABLE public."Event" (
    id bigint NOT NULL,
    "eventName" character varying(64) NOT NULL,
    "eventTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "eventDate" date NOT NULL,
    "userId" character varying(64) NOT NULL,
    "sessionId" character varying(64) NOT NULL,
    "pagePath" character varying(255),
    "pageTitle" character varying(200),
    "referrerDomain" character varying(120),
    "sessionSource" character varying(64),
    "sessionMedium" character varying(64),
    "sessionCampaign" character varying(120),
    "firstTouchSource" character varying(64),
    "firstTouchMedium" character varying(64),
    "firstTouchCampaign" character varying(120),
    slug character varying(120),
    "caseStudyTitle" character varying(200),
    percent integer,
    location character varying(64),
    method character varying(32),
    "destinationDomain" character varying(120),
    "linkText" character varying(120),
    success boolean,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deviceType" character varying(24),
    "countryCode" character varying(2)
);


ALTER TABLE public."Event" OWNER TO vansedita;

--
-- Name: Event_id_seq; Type: SEQUENCE; Schema: public; Owner: vansedita
--

CREATE SEQUENCE public."Event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Event_id_seq" OWNER TO vansedita;

--
-- Name: Event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vansedita
--

ALTER SEQUENCE public."Event_id_seq" OWNED BY public."Event".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: vansedita
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO vansedita;

--
-- Name: DailyAggregate id; Type: DEFAULT; Schema: public; Owner: vansedita
--

ALTER TABLE ONLY public."DailyAggregate" ALTER COLUMN id SET DEFAULT nextval('public."DailyAggregate_id_seq"'::regclass);


--
-- Name: Event id; Type: DEFAULT; Schema: public; Owner: vansedita
--

ALTER TABLE ONLY public."Event" ALTER COLUMN id SET DEFAULT nextval('public."Event_id_seq"'::regclass);


--
-- Data for Name: DailyAggregate; Type: TABLE DATA; Schema: public; Owner: vansedita
--

COPY public."DailyAggregate" (id, day, bucket, metric, dimension, value, "uniqueUsers", sessions, "createdAt", "updatedAt") FROM stdin;
505	2026-02-04	overview	users	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
506	2026-02-04	overview	sessions	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
507	2026-02-04	overview	pageviews	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
508	2026-02-04	overview	engagement_rate	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
509	2026-02-04	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
510	2026-02-04	overview	conversions	\N	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
511	2026-02-04	conversions	count	click_resume_download	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
512	2026-02-04	conversions	count	click_contact	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
513	2026-02-04	conversions	count	submit_contact_form	0	\N	\N	2026-02-17 19:03:55.445	2026-02-17 19:03:55.445
379	2026-02-03	overview	users	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
380	2026-02-03	overview	sessions	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
381	2026-02-03	overview	pageviews	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
382	2026-02-03	overview	engagement_rate	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
383	2026-02-03	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
384	2026-02-03	overview	conversions	\N	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
385	2026-02-03	conversions	count	click_resume_download	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
386	2026-02-03	conversions	count	click_contact	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
387	2026-02-03	conversions	count	submit_contact_form	0	\N	\N	2026-02-16 21:05:33.847	2026-02-16 21:05:33.847
631	2026-02-05	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
632	2026-02-05	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
633	2026-02-05	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
634	2026-02-05	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
635	2026-02-05	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
636	2026-02-05	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
637	2026-02-05	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
638	2026-02-05	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
639	2026-02-05	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.296	2026-02-18 12:33:43.296
640	2026-02-06	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
641	2026-02-06	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
642	2026-02-06	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
643	2026-02-06	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
644	2026-02-06	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
645	2026-02-06	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
646	2026-02-06	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
647	2026-02-06	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
648	2026-02-06	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.313	2026-02-18 12:33:43.313
649	2026-02-07	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
650	2026-02-07	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
651	2026-02-07	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
652	2026-02-07	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
653	2026-02-07	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
654	2026-02-07	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
655	2026-02-07	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
656	2026-02-07	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
657	2026-02-07	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.316	2026-02-18 12:33:43.316
658	2026-02-08	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
659	2026-02-08	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
660	2026-02-08	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
661	2026-02-08	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
662	2026-02-08	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
663	2026-02-08	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
664	2026-02-08	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
665	2026-02-08	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
666	2026-02-08	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.318	2026-02-18 12:33:43.318
667	2026-02-09	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
668	2026-02-09	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
669	2026-02-09	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
670	2026-02-09	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
671	2026-02-09	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
672	2026-02-09	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
673	2026-02-09	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
674	2026-02-09	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
675	2026-02-09	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.32	2026-02-18 12:33:43.32
676	2026-02-10	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
677	2026-02-10	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
678	2026-02-10	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
679	2026-02-10	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
680	2026-02-10	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
681	2026-02-10	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
682	2026-02-10	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
683	2026-02-10	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
684	2026-02-10	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.322	2026-02-18 12:33:43.322
685	2026-02-11	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
686	2026-02-11	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
687	2026-02-11	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
688	2026-02-11	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
689	2026-02-11	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
690	2026-02-11	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
691	2026-02-11	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
692	2026-02-11	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
693	2026-02-11	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.324	2026-02-18 12:33:43.324
694	2026-02-12	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
695	2026-02-12	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
696	2026-02-12	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
697	2026-02-12	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
698	2026-02-12	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
699	2026-02-12	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
700	2026-02-12	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
701	2026-02-12	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
702	2026-02-12	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.326	2026-02-18 12:33:43.326
703	2026-02-13	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
704	2026-02-13	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
705	2026-02-13	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
706	2026-02-13	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
707	2026-02-13	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
708	2026-02-13	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
709	2026-02-13	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
710	2026-02-13	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
711	2026-02-13	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.328	2026-02-18 12:33:43.328
712	2026-02-14	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
713	2026-02-14	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
714	2026-02-14	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
715	2026-02-14	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
716	2026-02-14	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
717	2026-02-14	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
718	2026-02-14	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
719	2026-02-14	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
720	2026-02-14	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.329	2026-02-18 12:33:43.329
721	2026-02-15	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
722	2026-02-15	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
723	2026-02-15	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
724	2026-02-15	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
725	2026-02-15	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
726	2026-02-15	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
727	2026-02-15	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
728	2026-02-15	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
729	2026-02-15	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.331	2026-02-18 12:33:43.331
730	2026-02-16	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
731	2026-02-16	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
732	2026-02-16	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
733	2026-02-16	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
734	2026-02-16	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
735	2026-02-16	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
736	2026-02-16	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
737	2026-02-16	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
738	2026-02-16	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.332	2026-02-18 12:33:43.332
739	2026-02-17	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
740	2026-02-17	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
741	2026-02-17	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
742	2026-02-17	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
743	2026-02-17	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
744	2026-02-17	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
745	2026-02-17	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
746	2026-02-17	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
747	2026-02-17	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.333	2026-02-18 12:33:43.333
748	2026-02-18	overview	users	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
749	2026-02-18	overview	sessions	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
750	2026-02-18	overview	pageviews	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
751	2026-02-18	overview	engagement_rate	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
752	2026-02-18	overview	avg_engagement_seconds	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
753	2026-02-18	overview	conversions	\N	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
754	2026-02-18	conversions	count	click_resume_download	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
755	2026-02-18	conversions	count	click_contact	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
756	2026-02-18	conversions	count	submit_contact_form	0	\N	\N	2026-02-18 12:33:43.335	2026-02-18 12:33:43.335
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: vansedita
--

COPY public."Event" (id, "eventName", "eventTime", "eventDate", "userId", "sessionId", "pagePath", "pageTitle", "referrerDomain", "sessionSource", "sessionMedium", "sessionCampaign", "firstTouchSource", "firstTouchMedium", "firstTouchCampaign", slug, "caseStudyTitle", percent, location, method, "destinationDomain", "linkText", success, metadata, "createdAt", "deviceType", "countryCode") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: vansedita
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b7b3632d-6f12-40ac-a6b1-8eed0deb2ef4	f65355182c5e6d181d5bf1c0edea00c3f80e97d00013bace94c27f96fded9b3d	2026-02-16 14:14:41.315365-05	20260216143000_init_analytics	\N	\N	2026-02-16 14:14:41.310748-05	1
1aa32e2a-42eb-4f90-98d6-fbf67f41b592	fabf8f3e9468ef907d8996c133340269abb16cf795529cb5a8a53c854256c6ea	2026-02-16 14:14:41.317683-05	20260216170000_add_filter_dimensions	\N	\N	2026-02-16 14:14:41.315722-05	1
\.


--
-- Name: DailyAggregate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vansedita
--

SELECT pg_catalog.setval('public."DailyAggregate_id_seq"', 756, true);


--
-- Name: Event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: vansedita
--

SELECT pg_catalog.setval('public."Event_id_seq"', 1, false);


--
-- Name: DailyAggregate DailyAggregate_pkey; Type: CONSTRAINT; Schema: public; Owner: vansedita
--

ALTER TABLE ONLY public."DailyAggregate"
    ADD CONSTRAINT "DailyAggregate_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: vansedita
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: vansedita
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: DailyAggregate_bucket_metric_day_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "DailyAggregate_bucket_metric_day_idx" ON public."DailyAggregate" USING btree (bucket, metric, day);


--
-- Name: DailyAggregate_day_bucket_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "DailyAggregate_day_bucket_idx" ON public."DailyAggregate" USING btree (day, bucket);


--
-- Name: DailyAggregate_day_bucket_metric_dimension_key; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE UNIQUE INDEX "DailyAggregate_day_bucket_metric_dimension_key" ON public."DailyAggregate" USING btree (day, bucket, metric, dimension);


--
-- Name: Event_countryCode_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_countryCode_eventTime_idx" ON public."Event" USING btree ("countryCode", "eventTime");


--
-- Name: Event_deviceType_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_deviceType_eventTime_idx" ON public."Event" USING btree ("deviceType", "eventTime");


--
-- Name: Event_eventDate_eventName_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_eventDate_eventName_idx" ON public."Event" USING btree ("eventDate", "eventName");


--
-- Name: Event_eventName_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_eventName_eventTime_idx" ON public."Event" USING btree ("eventName", "eventTime");


--
-- Name: Event_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_eventTime_idx" ON public."Event" USING btree ("eventTime");


--
-- Name: Event_pagePath_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_pagePath_eventTime_idx" ON public."Event" USING btree ("pagePath", "eventTime");


--
-- Name: Event_referrerDomain_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_referrerDomain_eventTime_idx" ON public."Event" USING btree ("referrerDomain", "eventTime");


--
-- Name: Event_sessionCampaign_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_sessionCampaign_eventTime_idx" ON public."Event" USING btree ("sessionCampaign", "eventTime");


--
-- Name: Event_sessionId_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_sessionId_eventTime_idx" ON public."Event" USING btree ("sessionId", "eventTime");


--
-- Name: Event_sessionSource_sessionMedium_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_sessionSource_sessionMedium_eventTime_idx" ON public."Event" USING btree ("sessionSource", "sessionMedium", "eventTime");


--
-- Name: Event_slug_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_slug_eventTime_idx" ON public."Event" USING btree (slug, "eventTime");


--
-- Name: Event_userId_eventTime_idx; Type: INDEX; Schema: public; Owner: vansedita
--

CREATE INDEX "Event_userId_eventTime_idx" ON public."Event" USING btree ("userId", "eventTime");


--
-- PostgreSQL database dump complete
--

\unrestrict DQNhoe3zRSaN5kLy3RfIIz3Ark0hg5SsGRcj83gRUhoqWmfFv5q5BnoSaQszZTu

