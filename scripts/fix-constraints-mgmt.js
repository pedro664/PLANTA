/**
 * Script para atualizar constraints usando Supabase Management API
 */

const { createClient } = require('@supabase/supabase-js');

const PROJECT_REF = 'vmwuxstyiurspttffykt';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw';

async function executeSQL() {
  console.log('🔧 Executando SQL via Supabase Database API...\n');

  const sql = `
    ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_water_frequency_check;
    ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_light_needs_check;
    ALTER TABLE plants ADD CONSTRAINT plants_water_frequency_check CHECK (water_frequency IN ('daily', 'every3days', 'weekly', 'biweekly', 'monthly'));
    ALTER TABLE plants ADD CONSTRAINT plants_light_needs_check CHECK (light_needs IN ('direct', 'indirect', 'shade'));
  `;

  // Tentar via pg connection string (se disponível)
  // Ou via Supabase SQL endpoint
  
  const endpoints = [
    `https://${PROJECT_REF}.supabase.co/rest/v1/`,
    `https://${PROJECT_REF}.supabase.co/pg/`,
  ];

  // Método alternativo: criar uma função RPC temporária
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION update_plant_constraints()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_water_frequency_check;
      ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_light_needs_check;
      ALTER TABLE plants ADD CONSTRAINT plants_water_frequency_check CHECK (water_frequency IN ('daily', 'every3days', 'weekly', 'biweekly', 'monthly'));
      ALTER TABLE plants ADD CONSTRAINT plants_light_needs_check CHECK (light_needs IN ('direct', 'indirect', 'shade'));
    END;
    $$;
  `;

  console.log('📋 SQL que precisa ser executado no Supabase SQL Editor:');
  console.log('=' .repeat(60));
  console.log(sql);
  console.log('=' .repeat(60));
  
  console.log('\n🌐 Abrindo Supabase SQL Editor...');
  
  // Abrir o navegador
  const { exec } = require('child_process');
  exec(`start https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  
  console.log('\n⏳ Aguardando 10 segundos para você executar o SQL...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Testar
  await testConstraints();
}

async function testConstraints() {
  console.log('\n🧪 Testando constraints...\n');
  
  const supabase = createClient(
    'https://vmwuxstyiurspttffykt.supabase.co',
    SERVICE_ROLE_KEY
  );

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

  let allPassed = true;
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
      console.log(`❌ ${test.water} + ${test.light}: FALHOU`);
      allPassed = false;
    } else {
      console.log(`✅ ${test.water} + ${test.light}: OK`);
      await supabase.from('plants').delete().eq('id', data.id);
    }
  }

  if (allPassed) {
    console.log('\n🎉 Todas as constraints foram atualizadas com sucesso!');
  } else {
    console.log('\n⚠️ Algumas constraints ainda não foram atualizadas.');
    console.log('Execute o SQL manualmente no Supabase SQL Editor.');
  }
}

executeSQL();
