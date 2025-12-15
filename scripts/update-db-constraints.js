/**
 * Script para atualizar as constraints do banco de dados
 * Permite todos os valores de water_frequency e light_needs
 */

const { createClient } = require('@supabase/supabase-js');

// Usar service role key para ter permissão de alterar schema
// NOTA: Você precisa executar isso no Supabase SQL Editor ou usar a service role key
const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
);

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  INSTRUÇÕES PARA ATUALIZAR AS CONSTRAINTS DO BANCO               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. Acesse o Supabase Dashboard:                                 ║
║     https://supabase.com/dashboard/project/vmwuxstyiurspttffykt  ║
║                                                                  ║
║  2. Vá em "SQL Editor" no menu lateral                           ║
║                                                                  ║
║  3. Cole e execute o SQL abaixo:                                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

-- ============================================
-- SQL PARA EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================

-- Remover constraints antigas
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_water_frequency_check;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_light_needs_check;

-- Adicionar novas constraints com todos os valores
ALTER TABLE plants ADD CONSTRAINT plants_water_frequency_check 
  CHECK (water_frequency IN ('daily', 'every3days', 'weekly', 'biweekly', 'monthly'));

ALTER TABLE plants ADD CONSTRAINT plants_light_needs_check 
  CHECK (light_needs IN ('direct', 'indirect', 'shade'));

-- Verificar se funcionou
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'plants'::regclass 
  AND contype = 'c';

-- ============================================
-- FIM DO SQL
-- ============================================

`);

// Testar se as constraints foram atualizadas
async function testConstraints() {
  console.log('\n🧪 Testando se as constraints foram atualizadas...\n');
  
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });
  
  if (!auth?.user) {
    console.log('❌ Erro no login');
    return;
  }

  const testCases = [
    { water: 'daily', light: 'direct' },
    { water: 'biweekly', light: 'indirect' },
    { water: 'monthly', light: 'shade' },
  ];

  for (const test of testCases) {
    const { data, error } = await supabase
      .from('plants')
      .insert([{
        user_id: auth.user.id,
        name: `Teste ${test.water} ${test.light}`,
        water_frequency: test.water,
        light_needs: test.light,
        status: 'fine'
      }])
      .select()
      .single();

    if (error) {
      console.log(`❌ ${test.water} + ${test.light}: ${error.message}`);
    } else {
      console.log(`✅ ${test.water} + ${test.light}: OK`);
      // Limpar teste
      await supabase.from('plants').delete().eq('id', data.id);
    }
  }
}

testConstraints();
