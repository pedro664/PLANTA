@echo off
echo ========================================
echo     EDUCULTIVO - BUILD FINAL DO APK
echo ========================================
echo.

echo Verificando se C:\planta existe...
if not exist "C:\planta" mkdir "C:\planta"

echo Removendo build anterior se existir...
if exist "C:\planta\planta-app" rmdir /s /q "C:\planta\planta-app"

echo Copiando projeto limpo para C:\planta...
xcopy "%~dp0" "C:\planta\planta-app\" /E /I /H /Y

echo.
echo Navegando para C:\planta\planta-app...
cd /d "C:\planta\planta-app"

echo.
echo Instalando dependencias...
npm install

echo.
echo Inicializando git...
git init
git add .
git commit -m "Initial commit for build"

echo.
echo Verificando login EAS...
eas whoami

echo.
echo Iniciando build do APK (preview)...
eas build --platform android --profile preview --non-interactive

echo.
echo ========================================
echo     BUILD CONCLUIDO!
echo ========================================
echo O APK sera baixado automaticamente quando pronto.
echo Verifique em: https://expo.dev/accounts/[seu-usuario]/projects/planta-app/builds
pause