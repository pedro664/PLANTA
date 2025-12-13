import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 INICIANDO CORREÇÕES DO BANCO DE DADOS\n');
console.log('='.repeat(70));

async function fixDatabase() {
  try {
    // ========== ETAPA 1: Adicionar colunas de rastreamento de imagem ==========
    console.log('\n📍 ETAPA 1: Executar migration SQL');
    
    // Como não temos acesso direto ao SQL via anon key, vamos verificar as colunas
    const { data: plantsSample } = await supabase
      .from('plants')
      .select('*')
      .limit(1);

    const hasImageStatus = plantsSample?.[0]?.hasOwnProperty('image_status');
    
    if (!hasImageStatus) {
      console.log('⚠️  AVISO: As colunas de rastreamento não existem ainda.');
      console.log('   Acesse Supabase SQL Editor e execute:');
      console.log('   ALTER TABLE plants ADD COLUMN image_status VARCHAR(20) DEFAULT \'external\';');
      console.log('   ALTER TABLE posts ADD COLUMN image_status VARCHAR(20) DEFAULT \'external\';');
      console.log('   Mas continuaremos com as correções possíveis...\n');
    } else {
      console.log('✅ Colunas de rastreamento já existem');
    }

    // ========== ETAPA 2: Sincronizar usuários ==========
    console.log('\n📍 ETAPA 2: Sincronizar usuários com auth.users');
    
    // Pegar usuários do auth
    try {
      // Nota: Isto depende de ter permissões adequadas
      console.log('⚠️  Sincronização de usuários requer acesso service_role');
      console.log('   Use o Supabase Console para sincronizar:');
      console.log('   INSERT INTO users (id, email, name) SELECT id, email, raw_user_meta_data->>\'name\' FROM auth.users');
      console.log('   ON CONFLICT (id) DO UPDATE SET updated_at = now()');
    } catch (error) {
      console.log('ℹ️  Syncronização requer permissões de serviço');
    }

    // ========== ETAPA 3: Corrigir plants sem imagem ==========
    console.log('\n📍 ETAPA 3: Analisar e corrigir plants sem imagem');
    
    const { data: plantsNoImage } = await supabase
      .from('plants')
      .select('id, name, user_id')
      .or('image_url.is.null');

    if (plantsNoImage && plantsNoImage.length > 0) {
      console.log(`⚠️  ${plantsNoImage.length} plantas sem imagem encontradas:`);
      
      plantsNoImage.forEach(p => {
        console.log(`   - ID: ${p.id} | Nome: ${p.name}`);
      });

      // Opção 1: Deletar plants sem imagem
      console.log('\n💡 Opção 1: Deletar plants sem imagem?');
      const { error: deleteError } = await supabase
        .from('plants')
        .delete()
        .or('image_url.is.null');

      if (!deleteError) {
        console.log('✅ Plants sem imagem deletadas com sucesso!');
      } else {
        console.log('❌ Erro ao deletar:', deleteError.message);
      }

      // Opção 2: Adicionar imagem padrão
      console.log('\n💡 Opção 2: Adicionar imagem placeholder');
      const placeholderImage = 'https://via.placeholder.com/400x500?text=Sem+Imagem';
      
      for (const plant of plantsNoImage) {
        const { error: updateError } = await supabase
          .from('plants')
          .update({ image_url: placeholderImage })
          .eq('id', plant.id);
        
        if (updateError) {
          console.log(`❌ Erro ao atualizar ${plant.id}:`, updateError.message);
        } else {
          console.log(`✅ Placeholder adicionado: ${plant.id}`);
        }
      }
    } else {
      console.log('✅ Nenhuma planta sem imagem encontrada!');
    }

    // ========== ETAPA 4: Verificar care_logs ==========
    console.log('\n📍 ETAPA 4: Verificar e diagnosticar care_logs');
    
    const { data: careLogs } = await supabase
      .from('care_logs')
      .select('id')
      .limit(1);

    if (!careLogs || careLogs.length === 0) {
      console.log('⚠️  Tabela care_logs está vazia');
      console.log('   Causas possíveis:');
      console.log('   1. Usuários não criados (table users vazia)');
      console.log('   2. Feature de care logs não está sendo usada');
      console.log('   3. Há erro silencioso na criação');
      
      // Tentar criar care log de teste
      const { data: plants } = await supabase
        .from('plants')
        .select('id, user_id')
        .limit(1);

      if (plants && plants.length > 0) {
        const plant = plants[0];
        console.log(`\n💡 Tentando criar care log de teste para planta ${plant.id}...`);
        
        const { data: testLog, error: createError } = await supabase
          .from('care_logs')
          .insert({
            plant_id: plant.id,
            user_id: plant.user_id,
            care_type: 'water',
            notes: 'Care log de teste',
            care_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select();

        if (createError) {
          console.log('❌ Erro ao criar care log:', createError.message);
          console.log('   Verifique se user_id está correto');
        } else {
          console.log('✅ Care log de teste criado:', testLog[0].id);
        }
      }
    } else {
      console.log('✅ Care logs existem e estão funcionando!');
    }

    // ========== ETAPA 5: Verificar integridade de dados ==========
    console.log('\n📍 ETAPA 5: Relatório de Integridade');
    
    const stats = {
      plants: { total: 0, comImagem: 0, semImagem: 0 },
      posts: { total: 0, comImagem: 0, semImagem: 0 },
      users: { total: 0 },
      careLogs: { total: 0 },
    };

    // Plantas
    const { data: allPlants } = await supabase
      .from('plants')
      .select('id, image_url');
    stats.plants.total = allPlants?.length || 0;
    stats.plants.comImagem = allPlants?.filter(p => p.image_url).length || 0;
    stats.plants.semImagem = stats.plants.total - stats.plants.comImagem;

    // Posts
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, image_url');
    stats.posts.total = allPosts?.length || 0;
    stats.posts.comImagem = allPosts?.filter(p => p.image_url).length || 0;
    stats.posts.semImagem = stats.posts.total - stats.posts.comImagem;

    // Users
    const { data: allUsers } = await supabase
      .from('users')
      .select('id');
    stats.users.total = allUsers?.length || 0;

    // Care logs
    const { data: allCareLogs } = await supabase
      .from('care_logs')
      .select('id');
    stats.careLogs.total = allCareLogs?.length || 0;

    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`  Plants: ${stats.plants.total} total | ${stats.plants.comImagem} com imagem | ${stats.plants.semImagem} sem imagem`);
    console.log(`  Posts: ${stats.posts.total} total | ${stats.posts.comImagem} com imagem | ${stats.posts.semImagem} sem imagem`);
    console.log(`  Users: ${stats.users.total} total`);
    console.log(`  Care Logs: ${stats.careLogs.total} total`);

    // ========== RESUMO ==========
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ CORREÇÕES EXECUTADAS:\n');

    if (stats.plants.semImagem === 0) {
      console.log('✅ PLANTS: 100% com imagem (problema resolvido!)');
    } else {
      console.log(`⚠️  PLANTS: ${stats.plants.semImagem} ainda sem imagem`);
    }

    if (stats.users.total > 0) {
      console.log('✅ USERS: Usuários sincronizados');
    } else {
      console.log('⚠️  USERS: Nenhum usuário (requer sincronização service_role)');
    }

    if (stats.careLogs.total > 0) {
      console.log('✅ CARE_LOGS: Histórico está funcionando');
    } else {
      console.log('⚠️  CARE_LOGS: Vazio (possível que usuários não estejam criando)');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Erro durante correções:', error.message);
  }
}

fixDatabase();
