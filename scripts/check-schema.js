const { Client } = require('pg');

const client = new Client({
  host: 'db.vmwuxstyiurspttffykt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'mCalwR3dDpT2Xn9o',
  ssl: { rejectUnauthorized: false }
});

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
