const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
);

async function testAuthenticatedUpload() {
  // Primeiro, fazer login com um usuário de teste
  console.log('Tentando login...');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });

  if (authError) {
    console.log('Erro no login:', authError.message);
    console.log('\nCriando usuário de teste...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'teste@teste.com',
      password: 'teste123'
    });
    
    if (signUpError) {
      console.log('Erro ao criar usuário:', signUpError.message);
      return;
    }
    
    console.log('Usuário criado! Tentando login novamente...');
    
    const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
      email: 'teste@teste.com',
      password: 'teste123'
    });
    
    if (retryError) {
      console.log('Erro no login após criar:', retryError.message);
      return;
    }
  }

  console.log('Login OK! Testando upload...');

  const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const { data, error } = await supabase.storage
    .from('plant-images')
    .upload('test/auth-test-' + Date.now() + '.png', testData, {
      contentType: 'image/png'
    });
    
  if (error) {
    console.log('❌ Upload falhou:', error.message);
  } else {
    console.log('✅ Upload com usuário autenticado OK!');
    console.log('Path:', data.path);
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('plant-images')
      .getPublicUrl(data.path);
    console.log('URL:', urlData.publicUrl);
  }
}

testAuthenticatedUpload();
