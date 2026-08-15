-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V9
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SETUP SOLD PROPERTIES HIDING
-- =========================================================================

-- 1. Adicionar coluna 'vendido' à tabela public.empreendimentos
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS vendido BOOLEAN DEFAULT FALSE;

-- 2. Remover a função get_empreendimentos_bbox antiga para evitar conflito de tipo de retorno (Out parameters different)
DROP FUNCTION IF EXISTS public.get_empreendimentos_bbox(FLOAT, FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS public.get_empreendimentos_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

-- 3. Recriar a função get_empreendimentos_bbox filtrando imóveis vendidos
CREATE OR REPLACE FUNCTION public.get_empreendimentos_bbox(
    min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT
)
RETURNS TABLE (
    id UUID, titulo VARCHAR, tipo VARCHAR, status VARCHAR,
    preco NUMERIC, quartos INT, vagas INT, area_m2 NUMERIC,
    imagem_url TEXT, endereco VARCHAR, bairro VARCHAR, cidade VARCHAR, conteudo_url TEXT,
    created_by UUID, created_by_name VARCHAR, created_by_role user_role,
    lat FLOAT, lng FLOAT,
    prioridade BOOLEAN, observacoes TEXT, averbacao TEXT,
    quartos_max INT, vagas_max INT, area_max_m2 NUMERIC,
    faixa VARCHAR, drive_url TEXT, vendido BOOLEAN
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, 
        e.titulo, 
        e.tipo, 
        e.status, 
        e.preco, 
        e.quartos, 
        e.vagas, 
        e.area_m2,
        COALESCE(
            NULLIF(e.imagem_url, ''), 
            (SELECT url FROM public.property_images WHERE property_id = e.id ORDER BY "order" ASC LIMIT 1)
        ) AS imagem_url,
        e.endereco, 
        e.bairro, 
        e.cidade, 
        e.conteudo_url,
        e.created_by, 
        e.created_by_name, 
        e.created_by_role,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng,
        e.prioridade, 
        e.observacoes, 
        e.averbacao,
        e.quartos_max, 
        e.vagas_max, 
        e.area_max_m2,
        e.faixa, 
        e.drive_url, 
        e.vendido
    FROM public.empreendimentos e
    WHERE ST_Intersects(
        e.localizacao,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    ) AND (e.vendido = FALSE OR e.vendido IS NULL);
END;
$$;

-- 3. Criar a nova função get_meus_empreendimentos para a aba Meus Imóveis
CREATE OR REPLACE FUNCTION public.get_meus_empreendimentos(broker_id UUID, user_role VARCHAR)
RETURNS TABLE (
    id UUID, titulo VARCHAR, tipo VARCHAR, status VARCHAR,
    preco NUMERIC, quartos INT, vagas INT, area_m2 NUMERIC,
    imagem_url TEXT, endereco VARCHAR, bairro VARCHAR, cidade VARCHAR, conteudo_url TEXT,
    created_by UUID, created_by_name VARCHAR, created_by_role user_role,
    lat FLOAT, lng FLOAT,
    prioridade BOOLEAN, observacoes TEXT, averbacao TEXT,
    quartos_max INT, vagas_max INT, area_max_m2 NUMERIC,
    faixa VARCHAR, drive_url TEXT, vendido BOOLEAN
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, 
        e.titulo, 
        e.tipo, 
        e.status, 
        e.preco, 
        e.quartos, 
        e.vagas, 
        e.area_m2,
        COALESCE(
            NULLIF(e.imagem_url, ''), 
            (SELECT url FROM public.property_images WHERE property_id = e.id ORDER BY "order" ASC LIMIT 1)
        ) AS imagem_url,
        e.endereco, 
        e.bairro, 
        e.cidade, 
        e.conteudo_url,
        e.created_by, 
        e.created_by_name, 
        e.created_by_role,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng,
        e.prioridade, 
        e.observacoes, 
        e.averbacao,
        e.quartos_max, 
        e.vagas_max, 
        e.area_max_m2,
        e.faixa, 
        e.drive_url, 
        e.vendido
    FROM public.empreendimentos e
    WHERE (user_role IN ('master', 'gerente')) OR (e.created_by = broker_id)
    ORDER BY e.criado_em DESC;
END;
$$;
