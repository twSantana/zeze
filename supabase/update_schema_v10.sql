-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V10
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX CONSTRUTORAS RLS POLICIES
-- =========================================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;

-- 1. Recriar política de Leitura (SELECT) baseada em usuário logado
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir leitura para todos autenticados" 
    ON public.construtoras FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- 2. Recriar política de Inserção (INSERT) baseada em usuário logado
DROP POLICY IF EXISTS "Permitir insercao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir insercao para todos autenticados" 
    ON public.construtoras FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Criar política de Atualização (UPDATE) baseada em usuário logado
DROP POLICY IF EXISTS "Permitir atualizacao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir atualizacao para todos autenticados" 
    ON public.construtoras FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Criar política de Exclusão (DELETE) baseada em usuário logado
DROP POLICY IF EXISTS "Permitir exclusao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir exclusao para todos autenticados" 
    ON public.construtoras FOR DELETE 
    USING (auth.uid() IS NOT NULL);
