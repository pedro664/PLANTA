# 📖 Índice de Documentação - Planta App

## 🎯 Comece Aqui

### Para Iniciantes
1. **SESSION_SUMMARY.md** ← 👈 COMECE AQUI
   - Resumo da sessão
   - O que foi feito
   - Status atual

2. **mcp-server/QUICK_START.md**
   - 30 segundos para começar
   - Comandos essenciais
   - Quick reference

### Para Detalhes Completos
3. **MCP_SERVER_SUMMARY.md**
   - Overview completo
   - Todas as ferramentas
   - Exemplos de uso

4. **MCP_SERVER_SETUP.md**
   - Setup passo a passo
   - Integração VS Code/Claude
   - Troubleshooting

## 📚 Documentação Técnica

### MCP Server
- **mcp-server/README.md** - Documentação técnica completa
- **mcp-server/INTEGRATION_GUIDE.md** - Exemplos de integração
- **mcp-server/index.js** - Código fonte comentado
- **mcp.json** - Configuração MCP

### Build & Deploy
- **eas.json** - Configuração EAS Build
- **app.json** - Configuração Expo
- **package.json** - Scripts e dependências

### Código
- **src/** - Código React Native
  - **services/** - Supabase, Auth, Database
  - **screens/** - Telas da app
  - **components/** - Componentes reutilizáveis
  - **context/** - State management

## 🔍 Procurando algo específico?

### Build APK
→ **SESSION_SUMMARY.md** → Seção "Próximos Passos para Build APK"

### Usar MCP Server
→ **mcp-server/QUICK_START.md** ou **INTEGRATION_GUIDE.md**

### Integrar com Claude
→ **MCP_SERVER_SUMMARY.md** → Seção "Integração com VS Code / Claude"

### Ferramentas MCP Disponíveis
→ **MCP_SERVER_SUMMARY.md** → Seção "Funcionalidades"

### Estrutura do Banco
→ **mcp-server/README.md** → Seção "Database Schema"

### Exemplos de Código
→ **INTEGRATION_GUIDE.md** → Seção "Exemplos de Uso"

### Troubleshooting
→ **MCP_SERVER_SETUP.md** → Seção "Troubleshooting"

## 📊 Mapa de Leitura Recomendada

```
COMEÇAR
   ↓
SESSION_SUMMARY.md ← Entender o que foi feito
   ↓
[Escolha um caminho...]
   
├─→ Quer gerar APK?
│   └─ SESSION_SUMMARY.md (Próximos Passos)
│
├─→ Quer usar MCP Server?
│   ├─ mcp-server/QUICK_START.md (rápido)
│   └─ INTEGRATION_GUIDE.md (detalhado)
│
└─→ Quer entender tudo?
    ├─ MCP_SERVER_SETUP.md (overview)
    ├─ MCP_SERVER_SUMMARY.md (funcionalidades)
    └─ mcp-server/README.md (técnico)
```

## 🗂️ Estrutura de Documentação

```
PLANTA/
├── 📄 README.md                          (Original do projeto)
├── 📄 SESSION_SUMMARY.md                 ⭐ COMECE AQUI
├── 📄 MCP_SERVER_SUMMARY.md              Resumo MCP
├── 📄 MCP_SERVER_SETUP.md                Guia de setup
│
├── 🔧 mcp-server/
│   ├── 📄 README.md                      Técnico
│   ├── 📄 QUICK_START.md                 ⚡ Rápido
│   ├── 📄 INTEGRATION_GUIDE.md           Exemplos
│   ├── 📄 .env.example                   Template
│   ├── 📜 index.js                       Código MCP
│   ├── 📜 test.js                        Testes
│   └── 📦 package.json
│
├── 📱 src/
│   ├── 🔌 services/
│   │   ├── supabase.js                   Config DB
│   │   ├── database.js                   Operações
│   │   └── ...
│   ├── 🖥️  screens/
│   ├── 🎨 components/
│   └── 📊 context/
│
├── ⚙️  Configuration
│   ├── app.json                          Expo config
│   ├── eas.json                          Build config
│   ├── package.json                      npm
│   ├── .env                              Credenciais
│   └── mcp.json                          MCP config
│
└── 📚 Other
    ├── BUILD_READY.md
    ├── WEB_READY_FINAL.md
    └── ...
```

## 🎓 Guias por Tópico

### 🌐 Usando Supabase
1. Entender credenciais → `.env`
2. Ver tabelas → `mcp-server/README.md` (Database Schema)
3. Consultar → `mcp-server/QUICK_START.md`
4. Exemplos → `INTEGRATION_GUIDE.md`

### 🔐 Segurança
1. Credenciais → `.env` (never commit)
2. RLS → Supabase Dashboard
3. MCP → `MCP_SERVER_SETUP.md` (Segurança)

### 📦 Build & Deploy
1. Local → `SESSION_SUMMARY.md` (Build APK)
2. CI/CD → `.github/workflows/`
3. Troubleshoot → `SESSION_SUMMARY.md`

### 💻 Desenvolvendo
1. Estrutura → `README.md` (original)
2. Services → `src/services/`
3. MCP → `mcp-server/index.js`

## 🔗 Links Rápidos

| Documento | Propósito | Tempo |
|-----------|-----------|-------|
| SESSION_SUMMARY.md | Visão geral | 5 min |
| QUICK_START.md | Começar | 2 min |
| INTEGRATION_GUIDE.md | Exemplos | 10 min |
| MCP_SERVER_SUMMARY.md | Detalhes | 15 min |
| README.md (mcp-server) | Técnico | 20 min |
| MCP_SERVER_SETUP.md | Setup completo | 30 min |

## 📝 Notas de Leitura

- ⭐ = Começar aqui
- ⚡ = Rápido e conciso
- 📖 = Detalhado
- 🔧 = Técnico
- 📚 = Referência

## 🆘 Ajuda Rápida

**"Quero gerar APK agora"**
→ SESSION_SUMMARY.md → Próximos Passos

**"Como usar MCP Server?"**
→ QUICK_START.md → npm start

**"Qual a estrutura do banco?"**
→ mcp-server/README.md → Database Schema

**"Erro ao rodar?"**
→ SESSION_SUMMARY.md → Troubleshooting

**"Exemplos de código?"**
→ INTEGRATION_GUIDE.md → Exemplos

---

**Última atualização**: 13 de Dezembro de 2025  
**Status**: ✅ Documentação Completa
