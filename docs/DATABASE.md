-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  volume smallint NOT NULL,
  unit bigint NOT NULL,
  assignor bigint NOT NULL,
  is_done boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone,
  user_id uuid NOT NULL,
  end_date date,
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_unit_fkey FOREIGN KEY (unit) REFERENCES public.unit_measurement(id),
  CONSTRAINT activities_assignor_fkey FOREIGN KEY (assignor) REFERENCES public.teams(id),
  CONSTRAINT activities_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  name character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teams (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  leader uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_leader_fkey FOREIGN KEY (leader) REFERENCES public.profiles(id)
);
CREATE TABLE public.unit_measurement (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unit_measurement_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users_roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  role_id bigint NOT NULL,
  CONSTRAINT users_roles_pkey PRIMARY KEY (id),
  CONSTRAINT users_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT users_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.users_teams (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  team_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_teams_pkey PRIMARY KEY (id),
  CONSTRAINT users_teams_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT users_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
