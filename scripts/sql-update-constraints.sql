-- ============================================
-- SQL PARA EXECUTAR NO SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/vmwuxstyiurspttffykt/sql
-- ============================================

-- 1. Remover constraints antigas
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_water_frequency_check;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_light_needs_check;

-- 2. Adicionar novas constraints com TODOS os valores
ALTER TABLE plants ADD CONSTRAINT plants_water_frequency_check 
  CHECK (water_frequency IN ('daily', 'every3days', 'weekly', 'biweekly', 'monthly'));

ALTER TABLE plants ADD CONSTRAINT plants_light_needs_check 
  CHECK (light_needs IN ('direct', 'indirect', 'shade'));

-- 3. Verificar se funcionou
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'plants'::regclass 
  AND contype = 'c';

-- ============================================
-- RESULTADO ESPERADO:
-- plants_water_frequency_check | CHECK ((water_frequency = ANY (ARRAY['daily'::text, 'every3days'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text])))
-- plants_light_needs_check | CHECK ((light_needs = ANY (ARRAY['direct'::text, 'indirect'::text, 'shade'::text])))
-- ============================================
