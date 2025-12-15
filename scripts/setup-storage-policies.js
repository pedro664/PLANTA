const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw'
);

async function updateBuckets() {
  const buckets = ['plant-images', 'post-images', 'avatars'];
  
  for (const bucket of buckets) {
    // Atualizar bucket para ser público
    const { data, error } = await supabase.storage.updateBucket(bucket, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760
    });
    
    if (error) {
      console.log('Erro ao atualizar ' + bucket + ':', error.message);
    } else {
      console.log('Bucket atualizado para público:', bucket);
    }
  }
}

async function testUploadWithAnonKey() {
  // Testar com chave anon
  const anonSupabase = createClient(
    'https://vmwuxstyiurspttffykt.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
  );
  
  const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const { data, error } = await anonSupabase.storage
    .from('plant-images')
    .upload('test/anon-test.png', testData, {
      contentType: 'image/png',
      upsert: true
    });
    
  if (error) {
    console.log('Upload com anon key falhou:', error.message);
    return false;
  } else {
    console.log('Upload com anon key OK!');
    await supabase.storage.from('plant-images').remove(['test/anon-test.png']);
    return true;
  }
}

async function main() {
  console.log('=== Configurando Storage ===\n');
  
  await updateBuckets();
  
  console.log('\n=== Testando upload com anon key ===\n');
  const success = await testUploadWithAnonKey();
  
  if (!success) {
    console.log('\nO upload com anon key ainda falha.');
    console.log('Você precisa configurar as políticas RLS no painel do Supabase:');
    console.log('1. Vá em Storage > Policies');
    console.log('2. Para cada bucket, adicione política:');
    console.log('   - SELECT: Permitir para todos (public)');
    console.log('   - INSERT: Permitir para authenticated');
    console.log('   - DELETE: Permitir para authenticated');
  }
}

main();
