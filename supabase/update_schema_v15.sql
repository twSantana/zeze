-- ==========================================
-- MIGRAÇÃO V15 - SELLMAPS
-- Adiciona coluna codigo_ref e gera IDs únicos para todos os imóveis existentes
-- ==========================================

-- 1. Adicionar coluna codigo_ref se não existir
ALTER TABLE empreendimentos ADD COLUMN IF NOT EXISTS codigo_ref TEXT;

-- 2. Atualizar todos os imóveis atuais que não possuem codigo_ref gerando código sequencial SM-XXXX
DO $$
DECLARE
    rec RECORD;
    counter INT := 1;
BEGIN
    FOR rec IN SELECT id FROM empreendimentos WHERE codigo_ref IS NULL OR codigo_ref = '' ORDER BY created_at ASC, id ASC LOOP
        UPDATE empreendimentos 
        SET codigo_ref = 'SM-' || LPAD(counter::text, 4, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- 3. Definir restrição de unicidade
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'empreendimentos_codigo_ref_key'
    ) THEN
        ALTER TABLE empreendimentos ADD CONSTRAINT empreendimentos_codigo_ref_key UNIQUE (codigo_ref);
    END IF;
END $$;
