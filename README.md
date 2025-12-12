# Educultivo - Build APK

## Pré-requisitos

1. **Node.js** instalado
2. **EAS CLI** instalado: `npm install -g @expo/eas-cli`
3. **Conta Expo** criada e logada: `eas login`

## Como gerar o APK

### Passo 1: Verificação
```bash
pre-build-check.bat
```

### Passo 2: Build
```bash
build-apk-final.bat
```

## Estrutura do Projeto

```
planta-app/
├── src/                 # Código fonte
├── assets/             # Imagens e recursos
├── android/            # Configuração Android
├── App.js              # Componente principal
├── package.json        # Dependências
├── app.json           # Configuração Expo
├── eas.json           # Configuração EAS Build
└── build-apk-final.bat # Script de build
```

## Arquivos Essenciais para Build

- ✅ **src/** - Código fonte da aplicação
- ✅ **assets/** - Ícones, splash screen, imagens
- ✅ **App.js** - Componente raiz
- ✅ **package.json** - Dependências e scripts
- ✅ **app.json** - Configuração do app
- ✅ **eas.json** - Perfis de build
- ✅ **metro.config.js** - Configuração do bundler
- ✅ **babel.config.js** - Configuração do Babel

## Processo de Build

1. O script copia o projeto para `C:\planta\planta-app\`
2. Instala as dependências
3. Inicializa git
4. Executa `eas build --platform android --profile preview`
5. O APK é gerado na nuvem e disponibilizado para download

## Troubleshooting

### Erro de login EAS
```bash
eas login
```

### Erro de dependências
```bash
npm install
```

### Limpar cache
```bash
clear-cache.bat
```

### Verificar configuração
```bash
pre-build-check.bat
```

## Links Úteis

- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Dashboard Expo](https://expo.dev/)
- [Builds do Projeto](https://expo.dev/accounts/[seu-usuario]/projects/planta-app/builds)