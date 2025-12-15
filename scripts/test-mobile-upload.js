/**
 * Teste que simula EXATAMENTE o fluxo do app mobile
 * Usa a mesma lógica do uploadService.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://vmwuxstyiurspttffykt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDU5NjAsImV4cCI6MjA4MDkyMTk2MH0.X2EmLwowSPitPRg4xp833Tome9CQBHqZD8VXSbbM0so'
);

// MESMA função do uploadService.js
const base64ToUint8Array = (base64String) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const base64 = base64String.replace(/[\s]/g, '');
  const len = base64.length;
  
  let bufferLength = Math.floor(len * 3 / 4);
  if (base64[len - 1] === '=') bufferLength--;
  if (base64[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const c1 = base64.charCodeAt(i);
    const c2 = base64.charCodeAt(i + 1);
    const c3 = base64.charCodeAt(i + 2);
    const c4 = base64.charCodeAt(i + 3);

    const e1 = lookup[c1];
    const e2 = lookup[c2];
    const e3 = base64[i + 2] === '=' ? 0 : lookup[c3];
    const e4 = base64[i + 3] === '=' ? 0 : lookup[c4];

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (base64[i + 2] !== '=') {
      bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    }
    if (base64[i + 3] !== '=') {
      bytes[p++] = ((e3 & 3) << 6) | e4;
    }
  }

  return bytes;
};

async function testMobileUpload() {
  console.log('🧪 TESTE DO FLUXO MOBILE DE UPLOAD\n');
  console.log('='.repeat(60));

  // 1. Login
  console.log('\n1️⃣ LOGIN');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: 'teste123'
  });

  if (authError) {
    console.log('❌ Erro no login:', authError.message);
    return;
  }
  console.log('✅ Login OK - User ID:', auth.user.id);

  // 2. Simular imagem do expo-image-picker (base64 de uma imagem real)
  console.log('\n2️⃣ SIMULAR IMAGEM DO EXPO-IMAGE-PICKER');
  
  // Imagem JPEG mínima válida (1x1 pixel vermelho)
  const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=';
  
  console.log('📸 Base64 length:', jpegBase64.length);

  // 3. Converter base64 para bytes (como faz o uploadService)
  console.log('\n3️⃣ CONVERTER BASE64 PARA BYTES');
  const bytes = base64ToUint8Array(jpegBase64);
  console.log('📦 Bytes criados:', bytes.length);

  // 4. Upload usando bytes.buffer (como faz o uploadService)
  console.log('\n4️⃣ UPLOAD PARA SUPABASE STORAGE');
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const fileName = `plants/test/${timestamp}_${randomId}.jpg`;

  console.log('📁 Nome do arquivo:', fileName);
  console.log('⬆️ Enviando bytes.buffer...');

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('plant-images')
    .upload(fileName, bytes.buffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.log('❌ ERRO NO UPLOAD:', uploadError.message);
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

  // 6. Verificar se URL é acessível
  console.log('\n5️⃣ VERIFICAR ACESSIBILIDADE');
  try {
    const response = await fetch(urlData.publicUrl);
    console.log('Status:', response.status, response.ok ? '✅' : '❌');
  } catch (e) {
    console.log('❌ Erro ao acessar URL:', e.message);
  }

  // 7. Criar planta no banco
  console.log('\n6️⃣ CRIAR PLANTA NO BANCO');
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .insert([{
      user_id: auth.user.id,
      name: 'Teste Mobile ' + timestamp,
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

  console.log('✅ Planta criada!');
  console.log('ID:', plant.id);
  console.log('Image URL:', plant.image_url);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTE COMPLETO - SUCESSO!');
  console.log('='.repeat(60));
}

testMobileUpload().catch(console.error);
