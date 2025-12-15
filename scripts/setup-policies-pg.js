const { Client } = require('pg');

// Conexão direta com o banco Supabase
const client = new Client({
  host: 'db.vmwuxstyiurspttffykt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function createPolicies() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados!\n');

    const queries = [
      `DROP POLICY IF EXISTS "Public read access" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects`,
      `DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects`,
      `CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (true)`,
      `CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated')`,
      `CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated')`,
      `CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated')`
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        console.log('✅', query.substring(0, 60) + '...');
      } catch (err) {
        console.log('⚠️', err.message);
      }
    }

    console.log('\n✅ Políticas configuradas!');
  } catch (err) {
    console.error('Erro de conexão:', err.message);
  } finally {
    await client.end();
  }
}

createPolicies();
