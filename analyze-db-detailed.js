import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function detailedAnalysis() {
  console.log('🔬 ANÁLISE DETALHADA DO BANCO DE DADOS\n');
  console.log('=' .repeat(70));

  try {
    // 1. Análise de Plantas
    console.log('\n📍 1. TABELA PLANTS');
    const { data: allPlants, count: plantsCount } = await supabase
      .from('plants')
      .select('*', { count: 'exact' });

    const plantsStats = {
      total: allPlants.length,
      comImagem: allPlants.filter(p => p.image_url).length,
      semImagem: allPlants.filter(p => !p.image_url).length,
      comPublica: allPlants.filter(p => p.is_public).length,
    };

    console.log(`  Total: ${plantsStats.total}`);
    console.log(`  Com image_url: ${plantsStats.comImagem} (${(plantsStats.comImagem/plantsStats.total*100).toFixed(1)}%)`);
    console.log(`  Sem image_url: ${plantsStats.semImagem} (${(plantsStats.semImagem/plantsStats.total*100).toFixed(1)}%)`);
    console.log(`  Públicas: ${plantsStats.comPublica}`);

    // Plantas sem imagem
    const noImage = allPlants.filter(p => !p.image_url);
    if (noImage.length > 0) {
      console.log(`\n  ⚠️ Plantas sem imagem:`);
      noImage.forEach(p => {
        console.log(`    - ${p.id}: ${p.name}`);
      });
    }

    // 2. Análise de Posts
    console.log('\n📍 2. TABELA POSTS');
    const { data: allPosts } = await supabase
      .from('posts')
      .select('*');

    const postsStats = {
      total: allPosts.length,
      comImagem: allPosts.filter(p => p.image_url).length,
      semImagem: allPosts.filter(p => !p.image_url).length,
      comPlanta: allPosts.filter(p => p.plant_id).length,
    };

    console.log(`  Total: ${postsStats.total}`);
    console.log(`  Com image_url: ${postsStats.comImagem} (${(postsStats.comImagem/postsStats.total*100).toFixed(1)}%)`);
    console.log(`  Sem image_url: ${postsStats.semImagem} (${(postsStats.semImagem/postsStats.total*100).toFixed(1)}%)`);
    console.log(`  Associados a plantas: ${postsStats.comPlanta}`);

    // 3. Análise de Care Logs
    console.log('\n📍 3. TABELA CARE_LOGS');
    const { data: allCareLogs } = await supabase
      .from('care_logs')
      .select('*');

    const careTypes = {};
    allCareLogs.forEach(log => {
      careTypes[log.care_type] = (careTypes[log.care_type] || 0) + 1;
    });

    console.log(`  Total: ${allCareLogs.length}`);
    console.log(`  Tipos de cuidados:`);
    Object.entries(careTypes).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });

    // 4. Análise de Usuários
    console.log('\n📍 4. TABELA USERS');
    const { data: allUsers } = await supabase
      .from('users')
      .select('*');

    const usersStats = {
      total: allUsers.length,
      comAvatar: allUsers.filter(u => u.avatar_url).length,
      semAvatar: allUsers.filter(u => !u.avatar_url).length,
      comBadges: allUsers.filter(u => u.badges && Array.isArray(u.badges) && u.badges.length > 0).length,
    };

    console.log(`  Total: ${usersStats.total}`);
    console.log(`  Com avatar_url: ${usersStats.comAvatar} (${(usersStats.comAvatar/usersStats.total*100).toFixed(1)}%)`);
    console.log(`  Sem avatar_url: ${usersStats.semAvatar}`);
    console.log(`  Com badges: ${usersStats.comBadges}`);

    // 5. Análise de Relacionamentos
    console.log('\n📍 5. INTEGRIDADE RELACIONAL');
    
    const orphanedPosts = allPosts.filter(p => p.plant_id && !allPlants.find(pl => pl.id === p.plant_id));
    const orphanedCareLogs = allCareLogs.filter(log => !allPlants.find(pl => pl.id === log.plant_id));
    
    console.log(`  Posts órfãos (plant_id inválido): ${orphanedPosts.length}`);
    console.log(`  Care logs órfãos (plant_id inválido): ${orphanedCareLogs.length}`);

    // 6. Imagens - Análise de URLs
    console.log('\n📍 6. ANÁLISE DE URLS DE IMAGEM');
    
    const plantImages = allPlants.filter(p => p.image_url);
    const postImages = allPosts.filter(p => p.image_url);
    const userAvatars = allUsers.filter(u => u.avatar_url);
    
    // Verificar fonte de imagens
    const plantImageSources = {
      supabase: plantImages.filter(p => p.image_url.includes('supabase')).length,
      unsplash: plantImages.filter(p => p.image_url.includes('unsplash')).length,
      outros: plantImages.filter(p => !p.image_url.includes('supabase') && !p.image_url.includes('unsplash')).length,
    };
    
    const postImageSources = {
      supabase: postImages.filter(p => p.image_url.includes('supabase')).length,
      unsplash: postImages.filter(p => p.image_url.includes('unsplash')).length,
      outros: postImages.filter(p => !p.image_url.includes('supabase') && !p.image_url.includes('unsplash')).length,
    };

    console.log(`  Plants:`);
    console.log(`    - Supabase Storage: ${plantImageSources.supabase}`);
    console.log(`    - URLs externas (Unsplash): ${plantImageSources.unsplash}`);
    console.log(`    - Outras fontes: ${plantImageSources.outros}`);

    console.log(`  Posts:`);
    console.log(`    - Supabase Storage: ${postImageSources.supabase}`);
    console.log(`    - URLs externas (Unsplash): ${postImageSources.unsplash}`);
    console.log(`    - Outras fontes: ${postImageSources.outros}`);

    console.log(`  Users:`);
    console.log(`    - Com avatar: ${userAvatars.length}`);
    console.log(`    - Sem avatar: ${usersStats.semAvatar}`);

    // 7. Recomendações
    console.log('\n' + '='.repeat(70));
    console.log('\n🎯 RECOMENDAÇÕES DE MELHORIA\n');
    
    const issues = [];
    
    if (plantsStats.semImagem > 0) {
      issues.push(`❌ ${plantsStats.semImagem} plantas sem imagem - implemente upload obrigatório ao criar planta`);
    }
    
    if (postsStats.semImagem > 0) {
      issues.push(`❌ ${postsStats.semImagem} posts sem imagem - adicione validação de imagem em posts`);
    }
    
    if (orphanedPosts.length > 0) {
      issues.push(`❌ ${orphanedPosts.length} posts órfãos - executar limpeza de dados`);
    }
    
    if (usersStats.semAvatar === usersStats.total) {
      issues.push(`❌ Nenhum usuário tem avatar - implemente upload de avatar no perfil`);
    }
    
    if (plantImageSources.supabase === 0) {
      issues.push(`⚠️ Plants não usa Supabase Storage - migrar para armazenamento próprio`);
    }
    
    if (allCareLogs.length === 0) {
      issues.push(`⚠️ Nenhum care log registrado - usuários podem não estar usando a funcionalidade`);
    }

    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });

    console.log('\n✅ Análise concluída!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

detailedAnalysis();
