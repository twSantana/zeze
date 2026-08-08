-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V3
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO CREATE THE CONSTRUTORAS TABLE
-- =========================================================================

-- 1. Criar a tabela de Construtoras
CREATE TABLE IF NOT EXISTS public.construtoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar segurança Row Level Security (RLS)
ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir leitura para todos autenticados" 
    ON public.construtoras FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir insercao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir insercao para todos autenticados" 
    ON public.construtoras FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
