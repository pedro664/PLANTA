# 🚀 Quick Start - MCP Server

## Em 30 Segundos

### 1. Iniciar o Servidor
```bash
cd mcp-server
npm start
```

✅ Você verá mensagem de sucesso

### 2. Em outro terminal - Testar
```bash
cd mcp-server
node test.js
```

✅ Todos os testes passando

## Pronto! ✨

Seu MCP Server está rodando e conectado ao Supabase!

## O que fazer agora?

- **Ler**: Abra `MCP_SERVER_SETUP.md` para entender melhor
- **Integrar**: Veja `mcp-server/INTEGRATION_GUIDE.md` para integrar com VS Code/Claude
- **Usar**: Chame qualquer uma das 9 ferramentas disponíveis
- **Testar**: Execute `node test.js` para validar conexão

## Comandos Principais

| Comando | O que faz |
|---------|-----------|
| `npm start` | Inicia o servidor MCP |
| `npm run dev` | Modo desenvolvimento com reload |
| `node test.js` | Testa todas as ferramentas |

## Ferramentas Disponíveis

| Ferramenta | Descrição |
|-----------|-----------|
| `query_plants` | Listar plantas 🌿 |
| `query_users` | Listar usuários 👥 |
| `query_care_logs` | Listar cuidados 📝 |
| `query_posts` | Listar posts 💬 |
| `get_user_stats` | Estatísticas 📊 |
| `get_plant_details` | Detalhes da planta 🔍 |
| `insert_plant` | Criar planta ➕ |
| `insert_care_log` | Registrar cuidado ➕ |
| `database_info` | Info do banco 📚 |

## Próximo Passo: Integração com Claude

```bash
# 1. Seu servidor está rodando
npm start

# 2. Configure no seu cliente MCP (Claude, VS Code, etc)
# Aponte para: localhost:3000/mcp
# Ou use: node mcp-server/index.js
```

## Dúvidas?

1. Verifique `README.md` em `mcp-server/`
2. Veja exemplos em `INTEGRATION_GUIDE.md`
3. Execute `node test.js` para validar

---

**Tudo pronto!** Seu MCP Server está funcional e pronto para ser integrado. 🎉
