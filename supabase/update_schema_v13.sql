-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V13
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX TEAM MANAGEMENT RLS POLICIES
-- =========================================================================

-- 1. Remover as políticas antigas restritivas da tabela profiles
DROP POLICY IF EXISTS "Permite atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite exclusão do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite inserção apenas do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite inserção de perfil pelo trigger de auth" ON public.profiles;
DROP POLICY IF EXISTS "Permite criação de perfil pelo trigger de auth" ON public.profiles;

-- 2. Criar políticas que permitem controle total para Master (Administrador) usando a função recursão-free is_master_user()
CREATE POLICY "Permite inserção pelo próprio usuário ou Master"
    ON public.profiles FOR INSERT
    WITH CHECK (
        auth.uid() = id OR 
        public.is_master_user()
    );

CREATE POLICY "Permite atualização pelo próprio usuário ou Master"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id OR 
        public.is_master_user()
    );

CREATE POLICY "Permite exclusão apenas por Master"
    ON public.profiles FOR DELETE
    USING (
        public.is_master_user()
    );
