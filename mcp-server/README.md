# Planta MCP Server

MCP (Model Context Protocol) Server for managing the Planta App Supabase database.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Supabase credentials:

```bash
cp .env.example .env
```

The server will automatically read from the parent `.env` file in the project root.

### 3. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Available Tools

### Query Operations

#### `query_plants`
Query plants from the database with optional filters.

**Parameters:**
- `userId` (optional): Filter by user ID
- `limit` (optional, default: 20): Max results
- `isPublic` (optional): Filter by public status

**Example:**
```javascript
{
  "name": "query_plants",
  "arguments": {
    "userId": "user-123",
    "limit": 10
  }
}
```

#### `query_care_logs`
Query care logs with filters.

**Parameters:**
- `plantId` (optional): Filter by plant ID
- `userId` (optional): Filter by user ID
- `limit` (optional, default: 50): Max results

#### `query_users`
Query users with pagination.

**Parameters:**
- `limit` (optional, default: 20): Max results
- `offset` (optional, default: 0): Pagination offset

#### `query_posts`
Query community posts.

**Parameters:**
- `limit` (optional, default: 20): Max results
- `offset` (optional, default: 0): Pagination offset
- `userId` (optional): Filter by user ID

### Analytics Operations

#### `get_user_stats`
Get detailed statistics for a specific user.

**Parameters:**
- `userId` (required): User ID

**Returns:**
- User profile with stats (total plants, care logs, posts)

#### `get_plant_details`
Get detailed information about a specific plant.

**Parameters:**
- `plantId` (required): Plant ID

**Returns:**
- Plant details with owner info and all care logs

### Insert Operations

#### `insert_plant`
Create a new plant record.

**Parameters:**
- `userId` (required): User ID
- `name` (required): Plant name
- `scientificName` (optional): Scientific name
- `description` (optional): Plant description
- `wateringFrequency` (required): Watering frequency in days

#### `insert_care_log`
Create a new care log entry.

**Parameters:**
- `userId` (required): User ID
- `plantId` (required): Plant ID
- `careType` (required): Type of care - `water`, `fertilize`, `prune`, `repot`, or `other`
- `notes` (optional): Care notes

### Database Operations

#### `database_info`
Get information about database tables and structure.

**Returns:**
- Database URL and table schemas

## Database Schema

### Users Table
- `id`: User ID
- `name`: User display name
- `email`: User email
- `avatar_url`: Avatar image URL
- `level`: User level
- `xp`: Experience points
- `total_plants`: Total plants owned
- `join_date`: Account creation date

### Plants Table
- `id`: Plant ID
- `user_id`: Owner user ID
- `name`: Plant name
- `scientific_name`: Scientific name
- `image_url`: Plant photo URL
- `description`: Plant description
- `status`: Plant health status
- `is_public`: Public visibility flag

### Care Logs Table
- `id`: Care log ID
- `plant_id`: Associated plant ID
- `user_id`: User who performed care
- `care_type`: Type of care provided
- `notes`: Care notes
- `care_date`: When care was provided
- `created_at`: When log was created

### Posts Table
- `id`: Post ID
- `user_id`: Post author
- `plant_id`: Associated plant
- `content`: Post content
- `image_url`: Post image
- `likes_count`: Number of likes
- `created_at`: Post creation date

## Integration with VS Code

To use this MCP Server with VS Code:

1. Create an MCP configuration in VS Code settings
2. Point to this server's startup command
3. Use the integrated MCP panel to query the database

## Development

### Testing Tools Locally

```javascript
import mcpServer from './index.js';

// Test a query
const result = await mcpServer.server.executeTool('query_plants', {
  limit: 5
});

console.log(result);
```

## Error Handling

The server includes comprehensive error handling:
- Missing environment variables check
- Supabase connection errors
- Invalid tool parameters
- Database query failures

All errors are returned in the format:
```json
{
  "error": true,
  "message": "Error description",
  "details": {}
}
```

## Security

- Only uses Supabase's anonymous key (public operations)
- No sensitive data stored in the server
- All database operations respect Supabase RLS policies
- Environment variables are not exposed

## Performance

- Queries include pagination support
- Configurable result limits
- Optimized SELECT queries with necessary joins
- Proper database indexing recommended

## Troubleshooting

**"Missing Supabase environment variables"**
- Ensure `.env` file exists with valid Supabase credentials
- Check that the parent project `.env` has the required keys

**Connection timeouts**
- Verify your Supabase URL and keys are correct
- Check internet connection
- Ensure Supabase project is active

**Tool not found**
- Run `database_info` to see all available tools
- Check tool name spelling matches exactly

## License

MIT
