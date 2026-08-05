-- Schema limpo para um novo projeto Supabase
-- Execute este arquivo em um novo projeto Supabase com as chaves atualizadas.

-- 1) Extensões necessárias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Tipo personalizado de papéis de usuário
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('corretor', 'gerente', 'master');
  END IF;
END $$;

-- 3) Tabela de perfis vinculada ao auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'corretor',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) Tabela de empreendimentos
CREATE TABLE IF NOT EXISTS public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  preco NUMERIC(12,2) NOT NULL,
  quartos INT DEFAULT 0,
  vagas INT DEFAULT 0,
  area_m2 NUMERIC(8,2) NOT NULL,
  imagem_url TEXT,
  endereco VARCHAR(255),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) DEFAULT 'Curitiba',
  conteudo_url TEXT DEFAULT '',
  localizacao GEOMETRY(Point,4326),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empreendimentos_localizacao ON public.empreendimentos USING GIST (localizacao);

-- 5) Tabela de keep-alive
CREATE TABLE IF NOT EXISTS public.system_ping (
  id INT PRIMARY KEY DEFAULT 1,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.system_ping (id, last_ping)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;

-- 6) Funções de helper para roles
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

-- 7) Habilita RLS
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8) Políticas de segurança para profiles
DROP POLICY IF EXISTS "Permite seleção de perfis para usuário autenticado" ON public.profiles;
DROP POLICY IF EXISTS "Permite inserção de perfil pelo trigger de auth" ON public.profiles;
DROP POLICY IF EXISTS "Permite atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite exclusão do próprio perfil" ON public.profiles;

CREATE POLICY "Permite seleção de perfis para usuário autenticado"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permite inserção de perfil pelo trigger de auth"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permite atualização do próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Permite exclusão do próprio perfil"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 9) Políticas de segurança para empreendimentos
DROP POLICY IF EXISTS "Leitura pública de empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas gerentes e masters podem criar empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas gerentes e masters podem atualizar empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas master pode deletar empreendimentos" ON public.empreendimentos;

CREATE POLICY "Leitura pública de empreendimentos"
  ON public.empreendimentos FOR SELECT
  USING (true);

CREATE POLICY "Apenas gerentes e masters podem criar empreendimentos"
  ON public.empreendimentos FOR INSERT
  WITH CHECK (public.is_gerente_ou_master());

CREATE POLICY "Apenas gerentes e masters podem atualizar empreendimentos"
  ON public.empreendimentos FOR UPDATE
  USING (public.is_gerente_ou_master());

CREATE POLICY "Apenas master pode deletar empreendimentos"
  ON public.empreendimentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master' AND ativo = TRUE
    )
  );

-- 10) Trigger para criação de perfil quando o usuário é criado no auth.users
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
  VALUES (NEW.id, profile_name, NEW.email, profile_role, TRUE)
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
