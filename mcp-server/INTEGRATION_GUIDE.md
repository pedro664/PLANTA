# MCP Server Integration Guide

## 🚀 Configuração do MCP Server com VS Code

Seu MCP Server está pronto para ser integrado com VS Code e outros editores.

## Instalação

### 1. Dependências já instaladas ✅
```bash
cd mcp-server
npm install  # Já feito!
```

### 2. Verificar Configuração do Supabase

O servidor detecrou automaticamente seus dados do Supabase:
- **URL**: https://vmwuxstyiurspttffykt.supabase.co
- **Configuração**: `.env` carregado do projeto raiz

### 3. Testar o Servidor

```bash
# Terminal 1: Iniciar o servidor
cd mcp-server
npm start

# Terminal 2: Executar testes
cd mcp-server
node test.js
```

## Integração com VS Code

### Opção 1: Usar extensão MCP (Recomendado)

1. Instale a extensão "MCP Client" ou similar no VS Code
2. Configure em `.vscode/settings.json`:

```json
{
  "mcp.servers": [
    {
      "name": "planta-database",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/index.js"]
    }
  ]
}
```

### Opção 2: Claude API Integration

Se você estiver usando Claude com MCP:

```bash
# Configurar Claude para usar este servidor
claude config set mcp-server planta-database
```

## Ferramentas Disponíveis

### 📊 Consultas

```javascript
// Listar todas as plantas de um usuário
{
  "tool": "query_plants",
  "params": {
    "userId": "user-id-here",
    "limit": 20
  }
}

// Listar registros de cuidados
{
  "tool": "query_care_logs",
  "params": {
    "plantId": "plant-id-here"
  }
}

// Listar usuários
{
  "tool": "query_users",
  "params": {
    "limit": 20,
    "offset": 0
  }
}

// Listar posts da comunidade
{
  "tool": "query_posts",
  "params": {
    "limit": 20
  }
}
```

### 👤 Analytics

```javascript
// Estatísticas de um usuário
{
  "tool": "get_user_stats",
  "params": {
    "userId": "user-id-here"
  }
}

// Detalhes de uma planta
{
  "tool": "get_plant_details",
  "params": {
    "plantId": "plant-id-here"
  }
}
```

### ➕ Inserções

```javascript
// Criar nova planta
{
  "tool": "insert_plant",
  "params": {
    "userId": "user-id-here",
    "name": "Monstera",
    "scientificName": "Monstera deliciosa",
    "wateringFrequency": 7
  }
}

// Criar registro de cuidado
{
  "tool": "insert_care_log",
  "params": {
    "userId": "user-id-here",
    "plantId": "plant-id-here",
    "careType": "water",
    "notes": "Regada completamente"
  }
}
```

### 📚 Info

```javascript
// Informações do banco de dados
{
  "tool": "database_info",
  "params": {}
}
```

## Exemplos de Uso

### Exemplo 1: Consultar Plantas Públicas

```javascript
const result = await mcp.call('query_plants', {
  isPublic: true,
  limit: 10
});
```

### Exemplo 2: Obter Estatísticas Completas do Usuário

```javascript
const stats = await mcp.call('get_user_stats', {
  userId: 'user-123'
});

console.log(`
  Usuário: ${stats.user.name}
  Plantas: ${stats.user.stats.total_plants}
  Registros de Cuidado: ${stats.user.stats.total_care_logs}
  Posts: ${stats.user.stats.total_posts}
`);
```

### Exemplo 3: Criar Planta e Registrar Cuidado

```javascript
// 1. Criar planta
const plant = await mcp.call('insert_plant', {
  userId: 'user-123',
  name: 'Samambaia',
  wateringFrequency: 3
});

// 2. Registrar cuidado
const careLog = await mcp.call('insert_care_log', {
  userId: 'user-123',
  plantId: plant.data.id,
  careType: 'water',
  notes: 'Regada no chuveiro'
});
```

## Arquitetura

```
mcp-server/
├── index.js          # MCP Server principal
├── package.json      # Dependências
├── test.js          # Script de testes
├── README.md        # Documentação
├── .env.example     # Exemplo de configuração
└── .env             # Suas credenciais (não commitar!)
```

## Segurança

✅ **Implementado:**
- Leitura de `.env` do projeto raiz
- Validação de credenciais do Supabase
- RLS (Row Level Security) respeitado
- Sem exposição de chaves secretas

⚠️ **Recomendações:**
- Nunca commitar `.env`
- Usar apenas a chave Supabase Anonymous (pública)
- Implementar rate limiting se expor via API
- Adicionar logs de auditoria para operações críticas

## Troubleshooting

### "Missing Supabase environment variables"
```bash
# Verifique o arquivo .env no projeto raiz
cat ../.env | grep SUPABASE
```

### Servidor não responde
```bash
# Teste a conexão Supabase
npm run dev  # Modo debug
```

### Ferramentas não disponíveis
```bash
# Liste as ferramentas
curl http://localhost:3000/tools  # Se expor HTTP
```

## Performance

- ✅ Queries otimizadas com `select()` específico
- ✅ Paginação integrada
- ✅ Índices no Supabase recomendados
- ⚠️ Limite padrão de 20 itens (ajustável)

## Próximos Passos

1. **Testar com dados reais**
   ```bash
   npm run test
   ```

2. **Expor como HTTP API** (opcional)
   ```bash
   # Instalar express e criar wrapper
   npm install express
   ```

3. **Integrar com Claude ou outra IA**
   ```bash
   # Configure MCP conforme documentação do serviço
   ```

4. **Adicionar mais ferramentas**
   - Editar plantas
   - Deletar registros
   - Gerar relatórios
   - Análise de crescimento

## Support

Para issues:
1. Verifique as credenciais Supabase
2. Teste com `node test.js`
3. Verifique logs: `npm run dev`
4. Consulte README.md para mais detalhes

---

**Status**: ✅ Configurado e Pronto para Usar
**Última Atualização**: 13 de Dezembro de 2025
