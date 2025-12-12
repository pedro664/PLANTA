@echo off
echo ========================================
echo   CONFIGURACAO GITHUB BUILD - EDUCULTIVO
echo ========================================
echo.

echo Inicializando repositorio Git...
git init

echo Adicionando arquivos...
git add .

echo Fazendo commit inicial...
git commit -m "Initial commit - Educultivo app ready for build"

echo.
echo ========================================
echo   PROXIMOS PASSOS:
echo ========================================
echo.
echo 1. Crie um repositorio no GitHub:
echo    https://github.com/new
echo.
echo 2. Configure o repositorio remoto:
echo    git remote add origin https://github.com/SEU-USUARIO/planta-app.git
echo.
echo 3. Envie o codigo:
echo    git push -u origin main
echo.
echo 4. Configure o EXPO_TOKEN nos Secrets do GitHub:
echo    - Va em: Settings ^> Secrets and variables ^> Actions
echo    - Adicione: EXPO_TOKEN = seu_token_expo
echo.
echo 5. Para obter o token Expo:
echo    eas whoami
echo    eas build:configure
echo.
echo 6. O build sera automatico a cada push!
echo.
pause