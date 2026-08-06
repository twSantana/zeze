-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO (CURITIBA & RMC)
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- =========================================================================

-- 1. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Tipos Personalizados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('corretor', 'gerente', 'master');
    END IF;
END $$;

-- 3. Tabelas Principais

-- Tabela de Perfis de Usuários (Vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'corretor',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Empreendimentos Imobiliários
CREATE TABLE IF NOT EXISTS public.empreendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,       -- Ex: 'Apartamento', 'Sobrado', 'Terreno'
    status VARCHAR(50) NOT NULL,     -- Ex: 'Lançamento', 'Em Obras', 'Pronto'
    preco NUMERIC(12, 2) NOT NULL,
    quartos INT DEFAULT 0,
    vagas INT DEFAULT 0,
    area_m2 NUMERIC(8, 2) NOT NULL,
    imagem_url TEXT NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) DEFAULT 'Curitiba',
    conteudo_url TEXT DEFAULT '',      -- Link externo para tour virtual/detalhes
    localizacao GEOMETRY(Point, 4326), -- Longitude, Latitude em WGS 84
    created_by UUID REFERENCES auth.users(id),
    created_by_name VARCHAR(255),
    created_by_role user_role DEFAULT 'corretor',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice Espacial para Consultas Rápidas
CREATE INDEX IF NOT EXISTS idx_empreendimentos_localizacao 
ON public.empreendimentos USING GIST (localizacao);

-- Tabela de Controle Interno (Keep-Alive)
CREATE TABLE IF NOT EXISTS public.system_ping (
    id INT PRIMARY KEY DEFAULT 1,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir registro inicial para o keep-alive se não existir
INSERT INTO public.system_ping (id, last_ping) 
VALUES (1, NOW()) 
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 4. Regras de Negócio e Segurança (Row Level Security - RLS)
-- =========================================================================

-- Função Helper para verificar se o usuário é Gerente ou Master
CREATE OR REPLACE FUNCTION public.is_gerente_ou_master()
RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
BEGIN
    PERFORM set_config('row_security', 'off', true);
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid() AND ativo = TRUE;

    RETURN v_role IN ('gerente', 'master');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função Helper para verificar se o usuário é Master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
BEGIN
    PERFORM set_config('row_security', 'off', true);
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid() AND ativo = TRUE;

    RETURN v_role = 'master';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS nas tabelas
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a Tabela de Perfis (Profiles)
-- Removemos todas as políticas anteriores em vez de tentar basear-se em nomes específicos,
-- o que evita que políticas antigas persistam e causem recursão.
DO $$
DECLARE
    policy RECORD;
BEGIN
    FOR policy IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', policy.policyname);
    END LOOP;
END;
$$;

CREATE POLICY "Permite seleção de perfis para usuário autenticado"
    ON public.profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permite criação de perfil pelo trigger de auth"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permite atualização do próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Permite exclusão do próprio perfil"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Políticas RLS para a Tabela de Empreendimentos
DROP POLICY IF EXISTS "Leitura pública de empreendimentos" ON public.empreendimentos;
CREATE POLICY "Leitura pública de empreendimentos"
    ON public.empreendimentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas gerentes e masters podem criar empreendimentos" ON public.empreendimentos;
CREATE POLICY "Permite criação de empreendimentos pelos próprios criadores"
    ON public.empreendimentos FOR INSERT WITH CHECK (auth.uid() = created_by OR public.is_gerente_ou_master());

DROP POLICY IF EXISTS "Apenas gerentes e masters podem atualizar empreendimentos" ON public.empreendimentos;
CREATE POLICY "Permite atualização de empreendimentos pelo criador ou gestão"
    ON public.empreendimentos FOR UPDATE USING (auth.uid() = created_by OR public.is_gerente_ou_master());

DROP POLICY IF EXISTS "Apenas master pode deletar empreendimentos" ON public.empreendimentos;
CREATE POLICY "Apenas master pode deletar empreendimentos"
    ON public.empreendimentos FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'master' AND ativo = TRUE
        )
    );

-- =========================================================================
-- 5. Consultas Espaciais e Automações (RPC & Cron Job)
-- =========================================================================

-- Função de Consulta por Viewport do Mapa (Bounding Box)
CREATE OR REPLACE FUNCTION public.get_empreendimentos_bbox(
    min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT
)
RETURNS TABLE (
    id UUID, titulo VARCHAR, tipo VARCHAR, status VARCHAR,
    preco NUMERIC, quartos INT, vagas INT, area_m2 NUMERIC,
    imagem_url TEXT, endereco VARCHAR, bairro VARCHAR, cidade VARCHAR, conteudo_url TEXT,
    created_by UUID, created_by_name VARCHAR, created_by_role user_role,
    lat FLOAT, lng FLOAT
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, e.titulo, e.tipo, e.status, e.preco, e.quartos, e.vagas, e.area_m2,
        e.imagem_url, e.endereco, e.bairro, e.cidade, e.conteudo_url,
        e.created_by, e.created_by_name, e.created_by_role,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng
    FROM public.empreendimentos e
    WHERE ST_Intersects(
        e.localizacao,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$$;

-- Rotina de Prevenção de Pausa (Keep-Alive Anti-Sleep)
SELECT cron.schedule(
    'keep-supabase-alive-3days',
    '0 0 */3 * *',
    $$ UPDATE public.system_ping SET last_ping = NOW() WHERE id = 1; $$
);

-- Gatilho automático para criar Perfil quando um novo usuário se cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    profile_name TEXT := 'Novo Corretor';
    profile_role user_role := 'corretor';
BEGIN
    PERFORM set_config('row_security', 'off', true);

    IF NEW.raw_user_meta_data IS NOT NULL THEN
        profile_name := COALESCE(NEW.raw_user_meta_data->>'nome', profile_name);
        IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
            BEGIN
                profile_role := (NEW.raw_user_meta_data->>'role')::user_role;
            EXCEPTION WHEN invalid_text_representation OR undefined_object THEN
                profile_role := 'corretor';
            END;
        END IF;
    END IF;

    INSERT INTO public.profiles (id, nome, email, role, ativo)
    VALUES (
        NEW.id,
        profile_name,
        NEW.email,
        profile_role,
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user ignored exception: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- Tabela para imagens de propriedades
-- Cada imagem é armazenada no Storage do Supabase e referenciada aqui
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
    bucket VARCHAR(255) NOT NULL DEFAULT 'property-images',
    path TEXT NOT NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    width INT,
    height INT,
    "order" INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
