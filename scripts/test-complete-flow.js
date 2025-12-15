/**
 * Teste completo do fluxo de upload de imagens
 * Simula exatamente o que acontece no app mobile
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
);

// Função base64ToBytes igual à do uploadService.js
const base64ToBytes = (base64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  const cleanBase64 = base64.replace(/[\s=]/g, '');
  const len = cleanBase64.length;
  const bufferLength = Math.floor(len * 3 / 4);
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[cleanBase64.charCodeAt(i)] || 0;
    const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)] || 0;
    const encoded3 = lookup[cleanBase64.charCodeAt(i + 2)] || 0;
    const encoded4 = lookup[cleanBase64.charCodeAt(i + 3)] || 0;
    
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (i + 2 < len) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (i + 3 < len) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }
  
  return bytes.slice(0, p);
};

async function testCompleteFlow() {
  console.log('🧪 TESTE COMPLETO DO FLUXO DE UPLOAD\n');
  console.log('='.repeat(50));

  // 1. Login
  console.log('\n1️⃣ AUTENTICAÇÃO');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });

  if (authError) {
    console.log('❌ Erro no login:', authError.message);
    return;
  }
  console.log('✅ Login OK - User ID:', auth.user.id);

  // 2. Verificar/criar usuário na tabela users
  console.log('\n2️⃣ VERIFICAR USUÁRIO NA TABELA USERS');
  let { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (!userProfile) {
    console.log('⚠️ Usuário não existe na tabela users. Criando...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        id: auth.user.id,
        email: auth.user.email,
        name: 'Usuário Teste',
        avatar_url: null
      }])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erro ao criar usuário:', createError.message);
      return;
    }
    userProfile = newUser;
    console.log('✅ Usuário criado na tabela users');
  } else {
    console.log('✅ Usuário já existe na tabela users');
  }

  // 3. Criar imagem de teste (PNG válido)
  console.log('\n3️⃣ PREPARAR IMAGEM DE TESTE');
  // PNG 1x1 pixel verde
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const bytes = base64ToBytes(pngBase64);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  console.log('✅ Imagem preparada:', bytes.length, 'bytes');

  // 4. Testar upload para plant-images
  console.log('\n4️⃣ UPLOAD PARA BUCKET plant-images');
  const plantFileName = `plants/test/${Date.now()}_test.jpg`;
  const { data: plantUpload, error: plantUploadError } = await supabase.storage
    .from('plant-images')
    .upload(plantFileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '3600',
    });

  if (plantUploadError) {
    console.log('❌ Erro no upload:', plantUploadError.message);
    return;
  }
  
  const { data: plantUrl } = supabase.storage.from('plant-images').getPublicUrl(plantFileName);
  console.log('✅ Upload OK');
  console.log('🔗 URL:', plantUrl.publicUrl);

  // 5. Criar planta no banco
  console.log('\n5️⃣ CRIAR PLANTA NO BANCO');
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .insert([{
      user_id: auth.user.id,
      name: 'Planta Teste ' + Date.now(),
      image_url: plantUrl.publicUrl,
      image_status: 'supabase',
      water_frequency: 'weekly',
      light_needs: 'indirect',
      status: 'fine'
    }])
    .select()
    .single();

  if (plantError) {
    console.log('❌ Erro ao criar planta:', plantError.message);
    return;
  }
  console.log('✅ Planta criada - ID:', plant.id);
  console.log('📸 Image URL:', plant.image_url);

  // 6. Testar upload para post-images
  console.log('\n6️⃣ UPLOAD PARA BUCKET post-images');
  const postFileName = `posts/test/${Date.now()}_test.jpg`;
  const { data: postUpload, error: postUploadError } = await supabase.storage
    .from('post-images')
    .upload(postFileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '3600',
    });

  if (postUploadError) {
    console.log('❌ Erro no upload:', postUploadError.message);
    return;
  }
  
  const { data: postUrl } = supabase.storage.from('post-images').getPublicUrl(postFileName);
  console.log('✅ Upload OK');
  console.log('🔗 URL:', postUrl.publicUrl);

  // 7. Criar post no banco
  console.log('\n7️⃣ CRIAR POST NO BANCO');
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert([{
      user_id: auth.user.id,
      plant_id: plant.id,
      image_url: postUrl.publicUrl,
      description: 'Post de teste ' + Date.now(),
      category: 'all',
      tags: ['teste']
    }])
    .select()
    .single();

  if (postError) {
    console.log('❌ Erro ao criar post:', postError.message);
    return;
  }
  console.log('✅ Post criado - ID:', post.id);
  console.log('📸 Image URL:', post.image_url);

  // 8. Verificar se URLs são acessíveis
  console.log('\n8️⃣ VERIFICAR ACESSIBILIDADE DAS URLs');
  
  try {
    const plantResponse = await fetch(plantUrl.publicUrl);
    console.log('🌱 Planta URL:', plantResponse.ok ? '✅ Acessível' : '❌ Erro ' + plantResponse.status);
  } catch (e) {
    console.log('🌱 Planta URL: ❌ Erro -', e.message);
  }

  try {
    const postResponse = await fetch(postUrl.publicUrl);
    console.log('📝 Post URL:', postResponse.ok ? '✅ Acessível' : '❌ Erro ' + postResponse.status);
  } catch (e) {
    console.log('📝 Post URL: ❌ Erro -', e.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
  console.log('='.repeat(50));
  console.log('\nResumo:');
  console.log('- Planta ID:', plant.id);
  console.log('- Planta Image:', plant.image_url);
  console.log('- Post ID:', post.id);
  console.log('- Post Image:', post.image_url);
}

testCompleteFlow().catch(console.error);
