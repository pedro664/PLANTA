/**
 * Test Script for Planta MCP Server
 * Run: node test.js
 */

import mcpServer from './index.js';

async function runTests() {
  console.log('\n🧪 Testing Planta MCP Server\n');

  try {
    // Test 1: Database Info
    console.log('📊 Test 1: Getting database info...');
    const dbInfo = await mcpServer.server.executeTool('database_info', {});
    console.log('✅ Database Info:', dbInfo.success ? 'OK' : 'FAILED');
    console.log('   Tables:', dbInfo.database.tables.map(t => t.name).join(', '));

    // Test 2: Query Plants (with limit)
    console.log('\n🌿 Test 2: Querying plants...');
    const plants = await mcpServer.server.executeTool('query_plants', {
      limit: 5
    });
    console.log('✅ Query Plants:', plants.success ? 'OK' : 'FAILED');
    console.log('   Found:', plants.count, 'plants');
    if (plants.data.length > 0) {
      console.log('   Sample:', plants.data[0].name);
    }

    // Test 3: Query Users
    console.log('\n👥 Test 3: Querying users...');
    const users = await mcpServer.server.executeTool('query_users', {
      limit: 5
    });
    console.log('✅ Query Users:', users.success ? 'OK' : 'FAILED');
    console.log('   Found:', users.count, 'users');

    // Test 4: Query Care Logs
    console.log('\n📝 Test 4: Querying care logs...');
    const careLogs = await mcpServer.server.executeTool('query_care_logs', {
      limit: 5
    });
    console.log('✅ Query Care Logs:', careLogs.success ? 'OK' : 'FAILED');
    console.log('   Found:', careLogs.count, 'care logs');

    // Test 5: Query Posts
    console.log('\n💬 Test 5: Querying posts...');
    const posts = await mcpServer.server.executeTool('query_posts', {
      limit: 5
    });
    console.log('✅ Query Posts:', posts.success ? 'OK' : 'FAILED');
    console.log('   Found:', posts.count, 'posts');

    console.log('\n✨ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

runTests();
