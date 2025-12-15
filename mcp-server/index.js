import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env file');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * MCP Server for Planta App
 * Provides database management tools via Model Context Protocol
 */
class PlantaMCPServer {
  constructor() {
    this.supabase = supabase;
    this.tools = this.defineTools();
  }

  /**
   * Define available tools for MCP
   */
  defineTools() {
    return [
      {
        name: 'query_plants',
        description: 'Query plants from the database with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Filter by user ID (optional)'
            },
            limit: {
              type: 'number',
              description: 'Limit number of results (default: 20)'
            },
            isPublic: {
              type: 'boolean',
              description: 'Filter by public status (optional)'
            }
          }
        }
      },
      {
        name: 'query_care_logs',
        description: 'Query care logs with filters',
        inputSchema: {
          type: 'object',
          properties: {
            plantId: {
              type: 'string',
              description: 'Filter by plant ID'
            },
            userId: {
              type: 'string',
              description: 'Filter by user ID'
            },
            limit: {
              type: 'number',
              description: 'Limit results (default: 50)'
            }
          }
        }
      },
      {
        name: 'query_users',
        description: 'Query users with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Limit results (default: 20)'
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination (default: 0)'
            }
          }
        }
      },
      {
        name: 'query_posts',
        description: 'Query community posts',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Limit results (default: 20)'
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination (default: 0)'
            },
            userId: {
              type: 'string',
              description: 'Filter by user ID (optional)'
            }
          }
        }
      },
      {
        name: 'get_user_stats',
        description: 'Get statistics for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID'
            }
          },
          required: ['userId']
        }
      },
      {
        name: 'get_plant_details',
        description: 'Get detailed information about a specific plant',
        inputSchema: {
          type: 'object',
          properties: {
            plantId: {
              type: 'string',
              description: 'Plant ID'
            }
          },
          required: ['plantId']
        }
      },
      {
        name: 'insert_plant',
        description: 'Create a new plant record',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'Plant name'
            },
            scientificName: {
              type: 'string',
              description: 'Scientific name (optional)'
            },
            description: {
              type: 'string',
              description: 'Plant description (optional)'
            },
            wateringFrequency: {
              type: 'number',
              description: 'Watering frequency in days'
            }
          },
          required: ['userId', 'name', 'wateringFrequency']
        }
      },
      {
        name: 'insert_care_log',
        description: 'Create a new care log entry',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID'
            },
            plantId: {
              type: 'string',
              description: 'Plant ID'
            },
            careType: {
              type: 'string',
              description: 'Type of care (water, fertilize, prune, etc.)',
              enum: ['water', 'fertilize', 'prune', 'repot', 'other']
            },
            notes: {
              type: 'string',
              description: 'Care notes (optional)'
            }
          },
          required: ['userId', 'plantId', 'careType']
        }
      },
      {
        name: 'database_info',
        description: 'Get information about database tables and structure',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, params) {
    try {
      switch (toolName) {
        case 'query_plants':
          return await this.queryPlants(params);
        case 'query_care_logs':
          return await this.queryCareLogs(params);
        case 'query_users':
          return await this.queryUsers(params);
        case 'query_posts':
          return await this.queryPosts(params);
        case 'get_user_stats':
          return await this.getUserStats(params);
        case 'get_plant_details':
          return await this.getPlantDetails(params);
        case 'insert_plant':
          return await this.insertPlant(params);
        case 'insert_care_log':
          return await this.insertCareLog(params);
        case 'database_info':
          return this.getDatabaseInfo();
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return {
        error: true,
        message: error.message,
        details: error
      };
    }
  }

  /**
   * Query plants
   */
  async queryPlants(params = {}) {
    const { userId, limit = 20, isPublic } = params;
    let query = this.supabase.from('plants').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic);
    }

    const { data, error } = await query.limit(limit);
    
    if (error) throw error;
    return {
      success: true,
      count: data.length,
      data
    };
  }

  /**
   * Query care logs
   */
  async queryCareLogs(params = {}) {
    const { plantId, userId, limit = 50 } = params;
    let query = this.supabase
      .from('care_logs')
      .select('*, plants(name), users(name)')
      .order('care_date', { ascending: false });

    if (plantId) {
      query = query.eq('plant_id', plantId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(limit);
    
    if (error) throw error;
    return {
      success: true,
      count: data.length,
      data
    };
  }

  /**
   * Query users
   */
  async queryUsers(params = {}) {
    const { limit = 20, offset = 0 } = params;
    
    const { data, error } = await this.supabase
      .from('users')
      .select('id, name, email, avatar_url, level, xp, total_plants, join_date')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      success: true,
      count: data.length,
      offset,
      data
    };
  }

  /**
   * Query posts
   */
  async queryPosts(params = {}) {
    const { limit = 20, offset = 0, userId } = params;
    let query = this.supabase
      .from('posts')
      .select('*, users(name, avatar_url), plants(name)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    
    if (error) throw error;
    return {
      success: true,
      count: data.length,
      offset,
      data
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(params) {
    const { userId } = params;

    // Get user profile
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get plants count
    const { data: plants, error: plantsError } = await this.supabase
      .from('plants')
      .select('id')
      .eq('user_id', userId);

    if (plantsError) throw plantsError;

    // Get care logs count
    const { data: careLogs, error: careLogsError } = await this.supabase
      .from('care_logs')
      .select('id')
      .eq('user_id', userId);

    if (careLogsError) throw careLogsError;

    // Get posts count
    const { data: posts, error: postsError } = await this.supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    if (postsError) throw postsError;

    return {
      success: true,
      user: {
        ...user,
        stats: {
          total_plants: plants.length,
          total_care_logs: careLogs.length,
          total_posts: posts.length
        }
      }
    };
  }

  /**
   * Get plant details
   */
  async getPlantDetails(params) {
    const { plantId } = params;

    const { data: plant, error: plantError } = await this.supabase
      .from('plants')
      .select('*, users(name, avatar_url), care_logs(*)')
      .eq('id', plantId)
      .single();

    if (plantError) throw plantError;

    return {
      success: true,
      data: plant
    };
  }

  /**
   * Insert a new plant
   */
  async insertPlant(params) {
    const { userId, name, scientificName, description, wateringFrequency } = params;

    const { data, error } = await this.supabase
      .from('plants')
      .insert([{
        user_id: userId,
        name,
        scientific_name: scientificName,
        description,
        watering_frequency_days: wateringFrequency,
        status: 'fine',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      success: true,
      message: `Plant "${name}" created successfully`,
      data
    };
  }

  /**
   * Insert a care log
   */
  async insertCareLog(params) {
    const { userId, plantId, careType, notes } = params;

    const { data, error } = await this.supabase
      .from('care_logs')
      .insert([{
        user_id: userId,
        plant_id: plantId,
        care_type: careType,
        notes,
        care_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      success: true,
      message: 'Care log created successfully',
      data
    };
  }

  /**
   * Get database info
   */
  getDatabaseInfo() {
    return {
      success: true,
      database: {
        url: supabaseUrl,
        tables: [
          {
            name: 'users',
            description: 'User profiles and authentication',
            columns: ['id', 'name', 'email', 'avatar_url', 'level', 'xp', 'total_plants', 'join_date']
          },
          {
            name: 'plants',
            description: 'Plant records for users',
            columns: ['id', 'user_id', 'name', 'scientific_name', 'image_url', 'description', 'status', 'is_public']
          },
          {
            name: 'care_logs',
            description: 'Care history for plants',
            columns: ['id', 'plant_id', 'user_id', 'care_type', 'notes', 'care_date', 'created_at']
          },
          {
            name: 'posts',
            description: 'Community posts',
            columns: ['id', 'user_id', 'plant_id', 'content', 'image_url', 'likes_count', 'created_at']
          },
          {
            name: 'comments',
            description: 'Post comments',
            columns: ['id', 'post_id', 'user_id', 'content', 'created_at']
          }
        ]
      }
    };
  }
}

/**
 * MCP Server Implementation
 * This implements the MCP protocol for VS Code integration
 */
class MCPServerProtocol {
  constructor() {
    this.server = new PlantaMCPServer();
  }

  /**
   * Process incoming MCP requests
   */
  async handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'tools/list':
        return {
          tools: this.server.tools
        };
      
      case 'tools/call':
        return await this.server.executeTool(params.name, params.arguments);
      
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Start the server
   */
  start() {
    console.log('🌱 Planta MCP Server starting...');
    console.log(`📚 Database: ${supabaseUrl}`);
    console.log(`✅ Available tools: ${this.server.tools.length}`);
    
    // For local testing
    console.log('\n📋 Available tools:');
    this.server.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    return this;
  }
}

// Start the server
const mcpServer = new MCPServerProtocol().start();

export default mcpServer;
export { PlantaMCPServer, MCPServerProtocol };
