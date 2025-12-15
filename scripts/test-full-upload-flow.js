/**
 * Script para testar o fluxo completo de upload de imagem
 * Simula o que acontece no app quando uma planta é criada
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
);

// Função para decodificar base64 (mesma do uploadService)
const base64ToBytes = (base64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  
  const len = base64.length;
  let bufferLength = len * 0.75;
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;
  
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];
    
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (base64[i + 2] !== '=') bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (base64[i + 3] !== '=') bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }
  
  return bytes;
};

async function testFullUploadFlow() {
  console.log('🧪 Testando fluxo completo de upload...\n');

  // 1. Login
  console.log('1️⃣ Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });

  if (authError) {
    console.log('❌ Erro no login:', authError.message);
    return;
  }
  console.log('✅ Login OK! User ID:', authData.user.id);

  // 2. Criar uma imagem de teste (PNG válido pequeno)
  console.log('\n2️⃣ Criando imagem de teste...');
  
  // PNG 1x1 pixel vermelho em base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  // Converter base64 para bytes (como faz o uploadService)
  const bytes = base64ToBytes(pngBase64);
  console.log('📦 Bytes criados:', bytes.length, 'bytes');

  // 3. Converter para ArrayBuffer (como faz a correção)
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  console.log('📦 ArrayBuffer criado:', arrayBuffer.byteLength, 'bytes');

  // 4. Fazer upload
  console.log('\n3️⃣ Fazendo upload para Supabase Storage...');
  const fileName = `test/full-flow-${Date.now()}.png`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('plant-images')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/png',
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.log('❌ Erro no upload:', uploadError.message);
    console.log('Detalhes:', JSON.stringify(uploadError, null, 2));
    return;
  }

  console.log('✅ Upload OK!');
  console.log('Path:', uploadData.path);

  // 5. Obter URL pública
  const { data: urlData } = supabase.storage
    .from('plant-images')
    .getPublicUrl(fileName);

  console.log('🔗 URL pública:', urlData.publicUrl);

  // 6. Testar se a URL é acessível
  console.log('\n4️⃣ Verificando se a URL é acessível...');
  try {
    const response = await fetch(urlData.publicUrl);
    if (response.ok) {
      console.log('✅ URL acessível! Status:', response.status);
    } else {
      console.log('⚠️ URL retornou status:', response.status);
    }
  } catch (fetchError) {
    console.log('❌ Erro ao acessar URL:', fetchError.message);
  }

  // 7. Criar registro de planta de teste
  console.log('\n5️⃣ Criando registro de planta no banco...');
  const { data: plantData, error: plantError } = await supabase
    .from('plants')
    .insert([{
      user_id: authData.user.id,
      name: 'Planta Teste Upload ' + Date.now(),
      image_url: urlData.publicUrl,
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

  console.log('✅ Planta criada com sucesso!');
  console.log('ID:', plantData.id);
  console.log('Nome:', plantData.name);
  console.log('Image URL:', plantData.image_url);
  console.log('Image Status:', plantData.image_status);

  console.log('\n🎉 Fluxo completo testado com sucesso!');
}

testFullUploadFlow().catch(console.error);
