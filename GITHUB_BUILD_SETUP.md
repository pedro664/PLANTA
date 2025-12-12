# 🚀 Setup GitHub Build - Educultivo

## 📋 Pré-requisitos

1. **Conta GitHub** ativa
2. **Conta Expo** ativa e logada
3. **Token Expo** configurado

## 🔧 Configuração Rápida

### 1. Execute o script de setup:
```bash
setup-github-build.bat
```

### 2. Crie repositório no GitHub:
- Acesse: https://github.com/new
- Nome: `planta-app` ou `educultivo-app`
- Público ou Privado (sua escolha)
- **NÃO** inicialize com README

### 3. Configure repositório remoto:
```bash
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPO.git
git branch -M main
git push -u origin main
```

### 4. Configure EXPO_TOKEN no GitHub:

#### Obter o token:
```bash
eas whoami
# Se não estiver logado: eas login

# Gerar token (se necessário):
eas build:configure
```

#### Adicionar no GitHub:
1. Vá para: **Settings** > **Secrets and variables** > **Actions**
2. Clique em **New repository secret**
3. Nome: `EXPO_TOKEN`
4. Valor: Seu token do Expo
5. Clique em **Add secret**

## 🏗️ Workflows Disponíveis

### 1. Build Automático (`build-apk.yml`)
- **Trigger**: Push para main/master
- **Ação**: Inicia build no Expo
- **Resultado**: Link para download no Expo Dashboard

### 2. Build e Release (`build-and-release.yml`)
- **Trigger**: Tags (v1.0.0) ou manual
- **Ação**: Build + Release no GitHub
- **Resultado**: APK anexado ao Release

## 🚀 Como Usar

### Build Automático:
```bash
git add .
git commit -m "Nova versão"
git push
```

### Build com Release:
```bash
git tag v1.0.1
git push origin v1.0.1
```

### Build Manual:
1. Vá para **Actions** no GitHub
2. Selecione **Build and Release APK**
3. Clique **Run workflow**
4. Digite a versão (ex: v1.0.1)
5. Clique **Run workflow**

## 📱 Resultado

### Build Automático:
- Build inicia no Expo
- Verifique em: https://expo.dev/accounts/SEU-USUARIO/projects/planta-app/builds

### Build com Release:
- APK disponível em: **Releases** do repositório
- Download direto do GitHub
- Changelog automático

## 🔍 Monitoramento

### Ver status do build:
1. Vá para **Actions** no GitHub
2. Clique no workflow em execução
3. Acompanhe os logs em tempo real

### Logs do Expo:
```bash
eas build:list
```

## ⚠️ Troubleshooting

### Erro de token:
- Verifique se EXPO_TOKEN está configurado
- Gere novo token: `eas build:configure`

### Erro de build:
- Verifique logs no GitHub Actions
- Teste localmente: `eas build --platform android --profile preview`

### Erro de upload:
- Verifique se o build foi concluído
- Aguarde alguns minutos e tente novamente

## 📋 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] Código enviado (`git push`)
- [ ] EXPO_TOKEN configurado nos Secrets
- [ ] Primeiro build executado com sucesso
- [ ] APK baixado e testado

---

**🎉 Parabéns!** Seu app agora tem build automático no GitHub!