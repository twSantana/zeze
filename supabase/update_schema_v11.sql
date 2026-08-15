-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V11
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SECURE THE ROLES AND DATA
-- =========================================================================

-- 1. Proteção contra Autopromoção de Cargo (Role Escalation Bypass)
-- Impede que um corretor use o console ou PostgREST para alterar seu próprio cargo para master/gerente
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
DECLARE
  caller_role public.user_role;
BEGIN
  -- Se o cargo (role) ou o estado de ativação (ativo) estiver mudando
  IF NEW.role <> OLD.role OR NEW.ativo <> OLD.ativo THEN
    -- Busca o cargo de quem está executando a query (usuário autenticado no momento)
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- Se o executor da query NÃO for master, reverte a alteração de cargo/ativo para o valor antigo
    IF caller_role IS DISTINCT FROM 'master' THEN
      NEW.role := OLD.role;
      NEW.ativo := OLD.ativo;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o gatilho de proteção antes de qualquer atualização na tabela profiles
DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_roles();


-- 2. Restringir escrita na tabela de Construtoras (Apenas Master e Gerente)
-- Corretores não devem ter permissão de criar, editar ou apagar marcas parceiras
DROP POLICY IF EXISTS "Permitir insercao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir insercao para gestores" 
    ON public.construtoras FOR INSERT 
    WITH CHECK (public.is_gerente_ou_master());

DROP POLICY IF EXISTS "Permitir atualizacao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir atualizacao para gestores" 
    ON public.construtoras FOR UPDATE 
    USING (public.is_gerente_ou_master());

DROP POLICY IF EXISTS "Permitir exclusao para todos autenticados" ON public.construtoras;
CREATE POLICY "Permitir exclusao para gestores" 
    ON public.construtoras FOR DELETE 
    USING (public.is_gerente_ou_master());


-- 3. Blindar Inserções de Perfil
-- Impede que um usuário crie perfis fictícios ou de terceiros diretamente via API
DROP POLICY IF EXISTS "Permite inserção de perfil pelo trigger de auth" ON public.profiles;
CREATE POLICY "Permite inserção apenas do próprio perfil"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
