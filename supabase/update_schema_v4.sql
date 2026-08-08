-- =========================================================================
-- SISTEMA DE MAPEAMENTO IMOBILIÁRIO - MIGRATION SCRIPT V4
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO SETUP MULTIPLE IMAGES PER PROPERTY
-- =========================================================================

-- 1. Criar a tabela de Imagens do Empreendimento
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    "order" INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar segurança Row Level Security (RLS)
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso para a tabela de imagens
DROP POLICY IF EXISTS "Permitir leitura de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir leitura de imagens para todos autenticados" 
    ON public.property_images FOR SELECT 
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir insercao de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir insercao de imagens para todos autenticados" 
    ON public.property_images FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir exclusao de imagens para todos autenticados" ON public.property_images;
CREATE POLICY "Permitir exclusao de imagens para todos autenticados" 
    ON public.property_images FOR DELETE 
    USING (auth.role() = 'authenticated');
