const https = require('https');

const SUPABASE_URL = 'vmwuxstyiurspttffykt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtd3V4c3R5aXVyc3B0dGZmeWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM0NTk2MCwiZXhwIjoyMDgwOTIxOTYwfQ.tH7Q3k1P-VIjxDmJDnkecRkqkdReUNp9X_ZasWHe4Mw';

const sql = `
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Permitir leitura pública em todos os buckets
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (true);

-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir update para usuários autenticados
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir delete para usuários autenticados
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
`;

const data = JSON.stringify({ query: sql });

const options = {
  hostname: SUPABASE_URL,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': data.length
  }
};

console.log('Executando SQL para criar políticas de storage...\n');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Políticas criadas com sucesso!');
    } else {
      console.log('Status:', res.statusCode);
      console.log('Resposta:', body);
      console.log('\nTentando método alternativo via pg...');
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.write(data);
req.end();
