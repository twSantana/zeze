-- Fix definitivo para public.profiles no Supabase
-- Executar este script no editor SQL do Supabase para remover políticas antigas
-- e aplicar apenas as regras necessárias.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    policy RECORD;
BEGIN
    FOR policy IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', policy.policyname);
    END LOOP;
END;
$$;

CREATE POLICY "Permite seleção de perfis para usuário autenticado"
    ON public.profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permite criação de perfil pelo trigger de auth"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permite atualização do próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Permite exclusão do próprio perfil"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Gatilho robusto para não bloquear o cadastro de usuário no auth.users
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
    VALUES (
        NEW.id,
        profile_name,
        NEW.email,
        profile_role,
        TRUE
    )
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

-- Opcional: confirma as políticas ativas após a correção
-- SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
