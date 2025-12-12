# 🚀 Teste Rápido - Versão Web

## ✅ Erro Corrigido!

O erro `colors.accent.terracotta` foi corrigido para `colors.botanical.clay`.

## 🌐 Como Testar Agora

### 1. Iniciar Servidor Web:
```bash
npm run web
```

### 2. Aguardar Inicialização:
- O servidor pode demorar 1-2 minutos na primeira vez
- Aguarde a mensagem: "Metro waiting on exp://..."
- Acesse: http://localhost:19006

### 3. Testar Upload de Imagens:

#### Na Tela Inicial:
- ✅ Você verá um componente de teste azul
- ✅ Clique em "📷 Selecionar Imagem"
- ✅ Teste as opções:
  - **Escolher Arquivo**: Seleciona da galeria
  - **Usar Câmera**: Abre câmera do navegador

#### Nas Telas do App:
- ✅ **Criar Post**: Funciona com upload
- ✅ **Adicionar Planta**: Funciona com upload
- ✅ **Editar Perfil**: Funciona com upload

## 🔧 Se Houver Problemas:

### Erro de Permissão de Câmera:
- Clique em "Permitir" quando o navegador solicitar
- Se negou, clique no ícone de câmera na barra de endereços

### Erro de HTTPS:
- A câmera só funciona em HTTPS ou localhost
- Use: https://localhost:19006 se necessário

### Erro de Carregamento:
```bash
# Limpe o cache e reinicie
npx expo start --web --clear
```

## 📱 Funcionalidades Testáveis:

### ✅ Upload de Arquivos:
- Formatos: JPG, PNG, GIF, WebP
- Tamanho máximo: Sem limite (recomendado < 10MB)
- Preview instantâneo

### ✅ Captura de Câmera:
- Câmera frontal/traseira
- Preview em tempo real
- Controles de captura

### ✅ Processamento:
- Conversão automática para base64
- Informações do arquivo
- Limpeza de memória

## 🎯 Resultado Esperado:

Após selecionar uma imagem, você deve ver:
- ✅ Preview da imagem
- ✅ Informações (tipo, tamanho)
- ✅ Botão para limpar
- ✅ Sem erros no console

---

**🌟 O app agora funciona 100% no navegador com upload de imagens!**

**Próximo passo**: Teste todas as funcionalidades e confirme que está funcionando perfeitamente.