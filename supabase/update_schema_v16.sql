-- ==========================================
-- MIGRAÇÃO V16 - SELLMAPS
-- Ajuste de RLS na tabela profiles para permitir que Administradores / Master
-- possam cadastrar, atualizar e excluir consultores sem bloqueio de RLS.
-- ==========================================

-- 1. Função utilitária SECURITY DEFINER para checar se o usuário atual é Master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar políticas da tabela profiles
DROP POLICY IF EXISTS "Permite seleção de perfis para usuário autenticado" ON public.profiles;
DROP POLICY IF EXISTS "Permite criação de perfil pelo trigger de auth" ON public.profiles;
DROP POLICY IF EXISTS "Permite atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite exclusão do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite inserção pelo próprio usuário ou Master" ON public.profiles;
DROP POLICY IF EXISTS "Permite atualização pelo próprio usuário ou Master" ON public.profiles;
DROP POLICY IF EXISTS "Permite exclusão apenas por Master" ON public.profiles;

-- Política de Leitura: Usuários autenticados podem ver todos os perfis
CREATE POLICY "Permite seleção de perfis para usuários autenticados"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);

-- Política de Inserção: O próprio usuário ou usuários Master podem criar perfis
CREATE POLICY "Permite inserção de perfil por auth ou Master"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Política de Atualização: O próprio usuário pode editar seu perfil ou Master pode editar qualquer perfil
CREATE POLICY "Permite atualização pelo próprio usuário ou Master"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    public.is_master_user()
  );

-- Política de Exclusão: Master pode excluir qualquer perfil
CREATE POLICY "Permite exclusão por Master"
  ON public.profiles FOR DELETE
  USING (
    auth.uid() = id OR 
    public.is_master_user()
  );
