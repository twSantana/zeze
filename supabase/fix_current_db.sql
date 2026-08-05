-- Correção definitiva para o banco Supabase atual
-- Execute este arquivo no editor SQL do projeto Supabase que estiver quebrado.

-- Cria o tipo user_role se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('corretor', 'gerente', 'master');
  END IF;
END $$;

-- Remove políticas/trigger antigos e reconstrói o schema mínimo.
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empreendimentos DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP POLICY IF EXISTS "Permite seleção de perfis para usuário autenticado" ON public.profiles;
DROP POLICY IF EXISTS "Permite inserção de perfil pelo trigger de auth" ON public.profiles;
DROP POLICY IF EXISTS "Permite atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permite exclusão do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Apenas Master pode gerenciar papéis e perfis de outros" ON public.profiles;
DROP POLICY IF EXISTS "Apenas Master pode gerenciar perfis de outros" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;

DROP POLICY IF EXISTS "Leitura pública de empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas gerentes e masters podem criar empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas gerentes e masters podem atualizar empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Apenas master pode deletar empreendimentos" ON public.empreendimentos;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_gerente_ou_master() CASCADE;
DROP FUNCTION IF EXISTS public.is_master_user() CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'corretor',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.empreendimentos
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_by_role public.user_role DEFAULT 'corretor';

UPDATE public.empreendimentos
SET imagem_url = 'https://via.placeholder.com/600x400?text=Imagem+Obrigatoria'
WHERE imagem_url IS NULL;

UPDATE public.empreendimentos
SET endereco = 'Endereço não informado'
WHERE endereco IS NULL;

ALTER TABLE IF EXISTS public.empreendimentos
  ALTER COLUMN imagem_url SET NOT NULL,
  ALTER COLUMN endereco SET NOT NULL;

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

CREATE OR REPLACE FUNCTION public.is_gerente_ou_master()
RETURNS BOOLEAN AS $$
DECLARE
  v_role public.user_role;
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
  v_role public.user_role;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid() AND ativo = TRUE;
  RETURN v_role = 'master';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Leitura pública de empreendimentos"
  ON public.empreendimentos FOR SELECT
  USING (true);

CREATE POLICY "Permite criação de empreendimentos pelos próprios criadores"
  ON public.empreendimentos FOR INSERT
  WITH CHECK (auth.uid() = created_by OR public.is_gerente_ou_master());

CREATE POLICY "Permite atualização de empreendimentos pelo criador ou gestão"
  ON public.empreendimentos FOR UPDATE
  USING (auth.uid() = created_by OR public.is_gerente_ou_master());

CREATE POLICY "Apenas master pode deletar empreendimentos"
  ON public.empreendimentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'master' AND ativo = TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.get_empreendimentos_bbox(
  min_lng FLOAT, min_lat FLOAT, max_lng FLOAT, max_lat FLOAT
)
RETURNS TABLE (
  id UUID,
  titulo VARCHAR,
  tipo VARCHAR,
  status VARCHAR,
  preco NUMERIC,
  quartos INT,
  vagas INT,
  area_m2 NUMERIC,
  imagem_url TEXT,
  endereco VARCHAR,
  bairro VARCHAR,
  cidade VARCHAR,
  conteudo_url TEXT,
  created_by UUID,
  created_by_name VARCHAR,
  created_by_role public.user_role,
  lat FLOAT,
  lng FLOAT
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_name TEXT := 'Novo Corretor';
  profile_role public.user_role := 'corretor';
BEGIN
  PERFORM set_config('row_security', 'off', true);

  IF NEW.raw_user_meta_data IS NOT NULL THEN
    profile_name := COALESCE(NEW.raw_user_meta_data->>'nome', profile_name);
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      BEGIN
        profile_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
