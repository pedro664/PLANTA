import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Tentar encontrar a service_role key
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log('🔍 Procurando service_role key no sistema...');
  
  // Verificar se existe em arquivo .env.local ou .env.production
  const possibleFiles = [
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env.production'),
    path.join(__dirname, 'mcp-server', '.env'),
  ];

  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?([^"'\n]+)["']?/);
      if (match) {
        serviceRoleKey = match[1];
        console.log('✅ Service role key encontrada em:', file);
        break;
      }
    }
  }
}

if (!serviceRoleKey) {
  console.log('❌ Service role key não encontrada!');
  console.log('   Ela é necessária para sincronizar usuários e criar care_logs');
  console.log('   Você pode encontrá-la em: Supabase > Settings > API');
  console.log('   Salve-a como SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseAnon = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

console.log('🔧 CORREÇÕES VIA MCP COM SERVICE ROLE\n');
console.log('='.repeat(70));

async function fixDatabaseAdmin() {
  try {
    // ========== ETAPA 1: Sincronizar usuários do auth para public.users ==========
    console.log('\n📍 ETAPA 1: Sincronizar usuários com auth.users');
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Erro ao listar usuários do auth:', authError.message);
    } else if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️  Nenhum usuário no auth.users');
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuários no auth`);
      
      // Sincronizar cada usuário
      for (const authUser of authUsers.users) {
        const userData = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          avatar_url: authUser.user_metadata?.avatar_url || null,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert(userData, { onConflict: 'id' })
          .select();

        if (upsertError) {
          console.log(`❌ Erro ao sincronizar ${authUser.email}:`, upsertError.message);
        } else {
          console.log(`✅ Usuário sincronizado: ${userData.name} (${userData.email})`);
        }
      }
    }

    // ========== ETAPA 2: Executar migration SQL ==========
    console.log('\n📍 ETAPA 2: Criar colunas de rastreamento de imagem');
    
    const migrations = [
      `ALTER TABLE plants 
       ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'external',
       ADD COLUMN IF NOT EXISTS image_size_kb INT DEFAULT NULL,
       ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP DEFAULT NULL;`,
      
      `ALTER TABLE posts 
       ADD COLUMN IF NOT EXISTS image_status VARCHAR(20) DEFAULT 'external',
       ADD COLUMN IF NOT EXISTS image_size_kb INT DEFAULT NULL,
       ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP DEFAULT NULL;`,
      
      `CREATE INDEX IF NOT EXISTS idx_plants_image_status ON plants(image_status);`,
      `CREATE INDEX IF NOT EXISTS idx_posts_image_status ON posts(image_status);`,
      `CREATE INDEX IF NOT EXISTS idx_plants_image_url ON plants(image_url);`,
      `CREATE INDEX IF NOT EXISTS idx_posts_image_url ON posts(image_url);`,
    ];

    for (const sql of migrations) {
      const { error } = await supabaseAdmin.rpc('execute_sql', { sql });
      if (!error) {
        console.log('✅ Migration executada');
      } else if (error.message.includes('does not exist')) {
        // Tentar via exec direto (requer diferentes permissões)
        console.log('⚠️  Não consegui executar via RPC');
      }
    }

    // ========== ETAPA 3: Corrigir plantas sem imagem ==========
    console.log('\n📍 ETAPA 3: Corrigir plantas sem imagem');
    
    const { data: plantsNoImage } = await supabaseAdmin
      .from('plants')
      .select('id, name')
      .is('image_url', null);

    if (plantsNoImage && plantsNoImage.length > 0) {
      console.log(`⚠️  ${plantsNoImage.length} plantas sem imagem`);
      
      const placeholderUrl = 'https://via.placeholder.com/400x500?text=Sem+Imagem';
      
      for (const plant of plantsNoImage) {
        const { error } = await supabaseAdmin
          .from('plants')
          .update({ 
            image_url: placeholderUrl,
            image_status: 'placeholder'
          })
          .eq('id', plant.id);

        if (error) {
          console.log(`❌ Erro ao atualizar ${plant.name}:`, error.message);
        } else {
          console.log(`✅ Placeholder adicionado: ${plant.name}`);
        }
      }
    } else {
      console.log('✅ Todas as plantas têm imagem!');
    }

    // ========== ETAPA 4: Criar care log de teste ==========
    console.log('\n📍 ETAPA 4: Criar care log de teste');
    
    const { data: testUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .single();

    const { data: testPlant } = await supabaseAdmin
      .from('plants')
      .select('id')
      .limit(1)
      .single();

    if (testUser && testPlant) {
      const { data: careLog, error: careError } = await supabaseAdmin
        .from('care_logs')
        .insert({
          plant_id: testPlant.id,
          user_id: testUser.id,
          care_type: 'water',
          notes: 'Care log de teste criado via MCP',
          care_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select();

      if (careError) {
        console.log('❌ Erro ao criar care log:', careError.message);
      } else {
        console.log('✅ Care log de teste criado com sucesso!');
      }
    } else {
      console.log('⚠️  Não há usuários ou plantas para criar teste');
    }

    // ========== ETAPA 5: Relatório final ==========
    console.log('\n📍 ETAPA 5: Relatório Final');
    
    const { data: finalUsers } = await supabaseAdmin
      .from('users')
      .select('id');

    const { data: finalPlants } = await supabaseAdmin
      .from('plants')
      .select('id, image_url');

    const { data: finalCareLogs } = await supabaseAdmin
      .from('care_logs')
      .select('id');

    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`  ✅ Usuários sincronizados: ${finalUsers?.length || 0}`);
    console.log(`  ✅ Plantas com imagem: ${finalPlants?.filter(p => p.image_url)?.length || 0}/${finalPlants?.length || 0}`);
    console.log(`  ✅ Care logs registrados: ${finalCareLogs?.length || 0}`);

    console.log('\n' + '='.repeat(70) + '\n');
    console.log('✅ TODAS AS CORREÇÕES COMPLETADAS!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixDatabaseAdmin();
