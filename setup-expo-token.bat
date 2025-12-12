@echo off
echo ========================================
echo   CONFIGURACAO EXPO TOKEN - GITHUB
echo ========================================
echo.

echo Verificando login no Expo...
eas whoami

echo.
echo ========================================
echo   COMO CONFIGURAR O TOKEN NO GITHUB:
echo ========================================
echo.
echo 1. Acesse: https://github.com/pedro664/PLANTA/settings/secrets/actions
echo.
echo 2. Clique em "New repository secret"
echo.
echo 3. Preencha:
echo    Nome: EXPO_TOKEN
echo    Valor: [copie o token abaixo]
echo.
echo 4. Para obter o token, execute:
echo    eas login
echo    eas build:configure
echo.
echo 5. Ou use o token da sessao atual (se logado):
echo.

echo Obtendo token da sessao atual...
eas whoami --json

echo.
echo ========================================
echo   LINKS UTEIS:
echo ========================================
echo.
echo - Repositorio: https://github.com/pedro664/PLANTA
echo - Secrets: https://github.com/pedro664/PLANTA/settings/secrets/actions
echo - Actions: https://github.com/pedro664/PLANTA/actions
echo - Expo Dashboard: https://expo.dev/
echo.
echo Apos configurar o token, faca um push para testar:
echo git add .
echo git commit -m "Test build"
echo git push
echo.
pause