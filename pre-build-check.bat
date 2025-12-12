@echo off
echo ========================================
echo   VERIFICACAO PRE-BUILD - EDUCULTIVO
echo ========================================
echo.

echo Verificando arquivos essenciais...

if not exist "package.json" (
    echo ❌ package.json nao encontrado!
    goto :error
) else (
    echo ✅ package.json encontrado
)

if not exist "app.json" (
    echo ❌ app.json nao encontrado!
    goto :error
) else (
    echo ✅ app.json encontrado
)

if not exist "eas.json" (
    echo ❌ eas.json nao encontrado!
    goto :error
) else (
    echo ✅ eas.json encontrado
)

if not exist "src\" (
    echo ❌ Pasta src/ nao encontrada!
    goto :error
) else (
    echo ✅ Pasta src/ encontrada
)

if not exist "assets\" (
    echo ❌ Pasta assets/ nao encontrada!
    goto :error
) else (
    echo ✅ Pasta assets/ encontrada
)

if not exist "App.js" (
    echo ❌ App.js nao encontrado!
    goto :error
) else (
    echo ✅ App.js encontrado
)

echo.
echo Verificando dependencias...
if not exist "node_modules\" (
    echo ⚠️  node_modules nao encontrado, executando npm install...
    npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependencias!
        goto :error
    )
) else (
    echo ✅ node_modules encontrado
)

echo.
echo Verificando EAS CLI...
eas --version >nul 2>&1
if errorlevel 1 (
    echo ❌ EAS CLI nao instalado!
    echo Execute: npm install -g @expo/eas-cli
    goto :error
) else (
    echo ✅ EAS CLI instalado
)

echo.
echo Verificando login EAS...
eas whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Nao logado no EAS!
    echo Execute: eas login
    goto :error
) else (
    echo ✅ Logado no EAS
)

echo.
echo ========================================
echo ✅ TODAS AS VERIFICACOES PASSARAM!
echo ========================================
echo Pronto para build! Execute: build-apk-final.bat
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo ❌ VERIFICACAO FALHOU!
echo ========================================
echo Corrija os erros acima antes de continuar.
echo.
pause
exit /b 1