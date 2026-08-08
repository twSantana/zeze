-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =========================================================================

-- 1. Adicionar novas colunas para prioridade, observações e averbação na tabela empreendimentos
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS prioridade BOOLEAN DEFAULT FALSE;
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS observacoes TEXT DEFAULT '';
ALTER TABLE public.empreendimentos ADD COLUMN IF NOT EXISTS averbacao TEXT DEFAULT '';

-- 2. Remover a função antiga get_empreendimentos_bbox para poder alterar seu tipo de retorno
DROP FUNCTION IF EXISTS public.get_empreendimentos_bbox(FLOAT, FLOAT, FLOAT, FLOAT);

-- 3. Criar a nova função get_empreendimentos_bbox com o novo tipo de retorno
CREATE OR REPLACE FUNCTION public.get_empreendimentos_bbox(
    min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT
)
RETURNS TABLE (
    id UUID, titulo VARCHAR, tipo VARCHAR, status VARCHAR,
    preco NUMERIC, quartos INT, vagas INT, area_m2 NUMERIC,
    imagem_url TEXT, endereco VARCHAR, bairro VARCHAR, cidade VARCHAR, conteudo_url TEXT,
    created_by UUID, created_by_name VARCHAR, created_by_role user_role,
    lat FLOAT, lng FLOAT,
    prioridade BOOLEAN, observacoes TEXT, averbacao TEXT
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, e.titulo, e.tipo, e.status, e.preco, e.quartos, e.vagas, e.area_m2,
        e.imagem_url, e.endereco, e.bairro, e.cidade, e.conteudo_url,
        e.created_by, e.created_by_name, e.created_by_role,
        ST_Y(e.localizacao::geometry) AS lat,
        ST_X(e.localizacao::geometry) AS lng,
        e.prioridade, e.observacoes, e.averbacao
    FROM public.empreendimentos e
    WHERE ST_Intersects(
        e.localizacao,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$$;
