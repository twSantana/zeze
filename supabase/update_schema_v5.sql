-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V5
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ADD TELEPHONE AND AVATAR COLS
-- =========================================================================

-- 1. Adicionar colunas de telefone e avatar na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_configured BOOLEAN DEFAULT FALSE;

-- 2. Atualizar políticas de escrita da tabela profiles (garantir que usuários podem atualizar seus próprios perfis)
DROP POLICY IF EXISTS "Permitir atualizacao do proprio perfil" ON public.profiles;
CREATE POLICY "Permitir atualizacao do proprio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
