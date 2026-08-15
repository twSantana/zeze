-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V8
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO REPAIR PROPERTY_IMAGES SCHEMA AND RLS
-- =========================================================================

-- 1. Garantir que todas as colunas existem na tabela public.property_images
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS bucket VARCHAR(255) DEFAULT 'property-images';
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS path TEXT;
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS width INT;
ALTER TABLE public.property_images ADD COLUMN IF NOT EXISTS height INT;

-- 2. Garantir que as colunas não impedem inserções por restrição de NOT NULL
ALTER TABLE public.property_images ALTER COLUMN bucket DROP NOT NULL;
ALTER TABLE public.property_images ALTER COLUMN path DROP NOT NULL;
ALTER TABLE public.property_images ALTER COLUMN filename DROP NOT NULL;

-- 3. Habilitar segurança Row Level Security (RLS)
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- 4. Recriar políticas de acesso simplificadas e robustas baseadas em auth.uid()
DROP POLICY IF EXISTS "Permitir leitura de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir leitura de imagens para todos autenticados" 
    ON public.property_images FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir insercao de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir insercao de imagens para todos autenticados" 
    ON public.property_images FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir exclusao de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir exclusao de imagens para todos autenticados" 
    ON public.property_images FOR DELETE 
    USING (auth.uid() IS NOT NULL);
