@echo off
echo ========================================
echo   ENVIANDO PARA GITHUB - EDUCULTIVO
echo ========================================
echo.

echo Inicializando repositorio Git...
git init

echo Configurando repositorio remoto...
git remote add origin https://github.com/pedro664/PLANTA.git

echo Configurando branch principal...
git branch -M main

echo Adicionando todos os arquivos...
git add .

echo Fazendo commit inicial...
git commit -m "Initial commit - Educultivo app ready for GitHub build"

echo Enviando para GitHub...
git push -u origin main

echo.
echo ========================================
echo   SUCESSO! CODIGO ENVIADO PARA GITHUB
echo ========================================
echo.
echo Repositorio: https://github.com/pedro664/PLANTA
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Configure o EXPO_TOKEN nos Secrets:
echo    - Va em: https://github.com/pedro664/PLANTA/settings/secrets/actions
echo    - Clique em "New repository secret"
echo    - Nome: EXPO_TOKEN
echo    - Valor: [seu token expo]
echo.
echo 2. Para obter o token Expo:
echo    eas whoami
echo    eas login (se necessario)
echo.
echo 3. Acesse Actions para ver o build:
echo    https://github.com/pedro664/PLANTA/actions
echo.
echo 4. O build sera automatico a cada push!
echo.
pause