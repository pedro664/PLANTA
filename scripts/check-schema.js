require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.SUPABASE_DB_HOST || 'db.vmwuxstyiurspttffykt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD environment variable is required');
  process.exit(1);
}

async function checkSchema() {
  await client.connect();
  
  // Verificar colunas da tabela plants
  const plantsResult = await client.query(
    "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'plants' AND column_name LIKE '%image%'"
  );
  
  console.log('=== Colunas de imagem na tabela PLANTS ===');
  plantsResult.rows.forEach(r => {
    console.log('  ' + r.column_name + ': ' + r.data_type + (r.character_maximum_length ? '(' + r.character_maximum_length + ')' : ''));
  });
  
  // Verificar colunas da tabela posts
  const postsResult = await client.query(
    "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'posts' AND column_name LIKE '%image%'"
  );
  
  console.log('\n=== Colunas de imagem na tabela POSTS ===');
  postsResult.rows.forEach(r => {
    console.log('  ' + r.column_name + ': ' + r.data_type + (r.character_maximum_length ? '(' + r.character_maximum_length + ')' : ''));
  });
  
  // Verificar colunas da tabela users
  const usersResult = await client.query(
    "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'users' AND (column_name LIKE '%image%' OR column_name LIKE '%avatar%')"
  );
  
  console.log('\n=== Colunas de imagem na tabela USERS ===');
  usersResult.rows.forEach(r => {
    console.log('  ' + r.column_name + ': ' + r.data_type + (r.character_maximum_length ? '(' + r.character_maximum_length + ')' : ''));
  });
  
  await client.end();
}

checkSchema();
