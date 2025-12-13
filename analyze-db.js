import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Iniciando análise do banco...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeDatabase() {
  try {
    // Query 1: Plantas com imagem
    console.log('📊 ANÁLISE DE IMAGENS - PLANTS');
    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select('*')
      .not('image_url', 'is', null);
    
    if (plantsError) throw plantsError;
    
    console.log(`Total com image_url: ${plants.length}`);
    if (plants.length > 0) {
      const sample = plants[0];
      console.log(`Amostra: ${JSON.stringify(sample, null, 2).substring(0, 300)}...`);
    }

    // Query 2: Posts com imagem
    console.log('\n📊 ANÁLISE DE IMAGENS - POSTS');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .not('image_url', 'is', null);
    
    if (postsError) throw postsError;
    
    console.log(`Total com image_url: ${posts.length}`);
    if (posts.length > 0) {
      const sample = posts[0];
      console.log(`Amostra: ${JSON.stringify(sample, null, 2).substring(0, 300)}...`);
    }

    // Query 3: Usuários com avatar
    console.log('\n📊 ANÁLISE DE IMAGENS - USERS');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .not('avatar_url', 'is', null);
    
    if (usersError) throw usersError;
    
    console.log(`Total com avatar_url: ${users.length}`);
    if (users.length > 0) {
      const sample = users[0];
      console.log(`Amostra: ${JSON.stringify(sample, null, 2).substring(0, 300)}...`);
    }

    // Query 4: Problemas potenciais - plantas sem imagem
    console.log('\n⚠️ PROBLEMAS POTENCIAIS');
    const { data: plantsNoImg } = await supabase
      .from('plants')
      .select('id, user_id, name, image_url, created_at');
    
    const nullImages = plantsNoImg.filter(p => !p.image_url).length;
    console.log(`Plantas SEM image_url: ${nullImages} / ${plantsNoImg.length}`);

    // Query 5: Care logs totais
    console.log('\n📊 ANÁLISE DE CARE LOGS');
    const { data: careLogs } = await supabase
      .from('care_logs')
      .select('care_type')
      .limit(100);
    
    const careTypes = {};
    careLogs.forEach(log => {
      careTypes[log.care_type] = (careTypes[log.care_type] || 0) + 1;
    });
    console.log('Tipos de care registrados:', careTypes);

    console.log('\n✅ Análise concluída!');
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

analyzeDatabase();
