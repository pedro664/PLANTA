@echo off
echo ========================================
echo   INICIANDO EDUCULTIVO - VERSAO WEB
echo ========================================
echo.

echo Verificando dependencias...
if not exist "node_modules\" (
    echo Instalando dependencias...
    npm install
)

echo.
echo Iniciando servidor web...
echo.
echo FUNCIONALIDADES WEB DISPONIVEIS:
echo - Upload de imagens via File API
echo - Captura de camera via getUserMedia
echo - Preview de imagens em tempo real
echo - Compatibilidade total com navegadores
echo.
echo Acesse: http://localhost:19006
echo.

npm run web

pause