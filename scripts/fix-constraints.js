/**
 * Script para atualizar constraints usando service role key
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw'
);

async function updateConstraints() {
  console.log('🔧 Atualizando constraints do banco de dados...\n');

  // O Supabase JS client não permite executar DDL diretamente
  // Mas podemos usar a REST API do Postgres
  
  const sql = `
    ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_water_frequency_check;
    ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_light_needs_check;
    ALTER TABLE plants ADD CONSTRAINT plants_water_frequency_check CHECK (water_frequency IN ('daily', 'every3days', 'weekly', 'biweekly', 'monthly'));
    ALTER TABLE plants ADD CONSTRAINT plants_light_needs_check CHECK (light_needs IN ('direct', 'indirect', 'shade'));
  `;

  // Tentar via fetch direto para a API REST do Supabase
  try {
    const response = await fetch('https://vmwuxstyiurspttffykt.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    console.log('Resposta:', result);
  } catch (e) {
    console.log('Erro na API REST:', e.message);
  }

  // Testar se funcionou
  console.log('\n🧪 Testando se as constraints foram atualizadas...\n');
  
  const testCases = [
    { water: 'daily', light: 'direct', desc: 'Diário + Sol direto' },
    { water: 'biweekly', light: 'indirect', desc: 'Quinzenal + Luz indireta' },
    { water: 'monthly', light: 'shade', desc: 'Mensal + Sombra' },
  ];

  // Fazer login como usuário de teste
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });

  if (!auth?.user) {
    console.log('❌ Erro no login');
    return;
  }

  for (const test of testCases) {
    const { data, error } = await supabase
      .from('plants')
      .insert([{
        user_id: auth.user.id,
        name: `Teste ${test.desc}`,
        water_frequency: test.water,
        light_needs: test.light,
        status: 'fine'
      }])
      .select()
      .single();

    if (error) {
      console.log(`❌ ${test.desc}: ${error.message}`);
    } else {
      console.log(`✅ ${test.desc}: OK`);
      await supabase.from('plants').delete().eq('id', data.id);
    }
  }
}

updateConstraints();
