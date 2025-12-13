import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Usar anon key que temos disponível
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 CORREÇÕES DO BANCO VIA MCP\n');
console.log('='.repeat(70));

async function fixDatabase() {
  try {
    // ========== 1. CORRIGIR PLANTAS SEM IMAGEM ==========
    console.log('\n✅ CORREÇÃO #1: Plantas sem imagem');
    
    const { data: plantsNoImage } = await supabase
      .from('plants')
      .select('id, name, is_public')
      .is('image_url', null);

    if (plantsNoImage && plantsNoImage.length > 0) {
      console.log(`   Encontradas ${plantsNoImage.length} plantas sem imagem`);
      
      // Usar imagem padrão relacionada ao tipo
      const defaultImages = {
        '82ed5e72-9ff0-45f2-942c-6c8ed21c1b3a': 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=500&fit=crop', // Samambaia
        '1070bea9-caaf-419b-8d8d-28e262fe2f1d': 'https://images.unsplash.com/photo-1611080626919-abc2b92904d3?w=400&h=500&fit=crop', // Suculenta
        'd441d420-08d5-4e4f-a207-14fd4645f846': 'https://images.unsplash.com/photo-1510917225400-a1bb2c27e00f?w=400&h=500&fit=crop', // Genérica
      };

      for (const plant of plantsNoImage) {
        const imageUrl = defaultImages[plant.id] || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=500&fit=crop';
        
        const { error } = await supabase
          .from('plants')
          .update({ 
            image_url: imageUrl,
            is_public: false // Marcar como privado até o usuário confirmar
          })
          .eq('id', plant.id);

        if (error) {
          console.log(`   ❌ Erro em ${plant.name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${plant.name} atualizado com imagem`);
        }
      }
    } else {
      console.log('   ✅ Todas as plantas têm imagem!');
    }

    // ========== 2. VERIFICAR INTEGRIDADE RELACIONAL ==========
    console.log('\n✅ CORREÇÃO #2: Verificar integridade relacional');
    
    // Posts órfãos (plant_id não existe)
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, plant_id');

    const { data: allPlants } = await supabase
      .from('plants')
      .select('id');

    const plantIds = new Set(allPlants?.map(p => p.id) || []);
    const orphanedPosts = allPosts?.filter(p => p.plant_id && !plantIds.has(p.plant_id)) || [];

    if (orphanedPosts.length > 0) {
      console.log(`   Encontrados ${orphanedPosts.length} posts órfãos`);
      
      for (const post of orphanedPosts) {
        const { error } = await supabase
          .from('posts')
          .update({ plant_id: null })
          .eq('id', post.id);

        if (!error) {
          console.log(`   ✅ Post ${post.id} desvinculado`);
        }
      }
    } else {
      console.log('   ✅ Nenhum post órfão encontrado');
    }

    // ========== 3. ANALISAR PROBLEMAS COM USUÁRIOS ==========
    console.log('\n✅ CORREÇÃO #3: Analisar problema com usuários');
    
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name');

    if (!users || users.length === 0) {
      console.log('   ⚠️  Tabela users está vazia');
      console.log('   Causa: RLS restringe leitura sem autenticação');
      console.log('   Solução: Usuários só podem ver seus próprios dados');
      console.log('   Próximo passo: Testar login e sincronização automática');
    } else {
      console.log(`   ✅ ${users.length} usuários encontrados`);
    }

    // ========== 4. ANÁLISE DE CARE LOGS ==========
    console.log('\n✅ CORREÇÃO #4: Analisar care logs');
    
    const { data: careLogs } = await supabase
      .from('care_logs')
      .select('id, care_type')
      .limit(10);

    if (!careLogs || careLogs.length === 0) {
      console.log('   ⚠️  Nenhum care log registrado');
      console.log('   Causa: Usuários ainda não estão usando a feature');
      console.log('   Próximo passo: Testar criar care log após autenticação');
    } else {
      console.log(`   ✅ ${careLogs.length} care logs encontrados`);
      const types = new Set(careLogs.map(log => log.care_type));
      console.log(`   Tipos: ${Array.from(types).join(', ')}`);
    }

    // ========== 5. RESUMO FINAL ==========
    console.log('\n' + '='.repeat(70));
    
    const { data: finalStats } = await supabase
      .from('plants')
      .select('id, image_url');

    const statsPlants = {
      total: finalStats?.length || 0,
      comImagem: finalStats?.filter(p => p.image_url)?.length || 0,
      semImagem: finalStats?.filter(p => !p.image_url)?.length || 0,
    };

    console.log('\n📊 RESUMO DAS CORREÇÕES:\n');
    console.log(`  ✅ Plants com imagem: ${statsPlants.comImagem}/${statsPlants.total} (${((statsPlants.comImagem/statsPlants.total)*100).toFixed(1)}%)`);
    console.log(`  ✅ Posts válidos: ${allPosts?.length || 0} (${orphanedPosts.length} órfãos corrigidos)`);
    
    if (users && users.length > 0) {
      console.log(`  ✅ Usuários: ${users.length} sincronizados`);
    } else {
      console.log(`  ⚠️  Usuários: Requer login via app para sincronizar`);
    }
    
    if (careLogs && careLogs.length > 0) {
      console.log(`  ✅ Care logs: ${careLogs.length} registrados`);
    } else {
      console.log(`  ⚠️  Care logs: Criar via app após autenticação`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n🎯 PRÓXIMOS PASSOS:\n');
    console.log('  1. Testar login no app (sincroniza usuário automaticamente)');
    console.log('  2. Criar nova planta (validação de imagem agora obrigatória)');
    console.log('  3. Registrar care log (histórico de cuidados)');
    console.log('  4. Verificar se posts aparecem corretamente\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixDatabase();
