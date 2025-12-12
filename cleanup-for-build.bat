@echo off
echo Limpando diretorio para build do APK...

echo Removendo arquivos de documentacao desnecessarios...
del /q APK_SOLUTION.md 2>nul
del /q BUILD_APK_GUIDE.md 2>nul
del /q BUILD_FINAL_GUIDE.md 2>nul
del /q BUILD_SETUP_COMPLETE.md 2>nul
del /q BUILD.md 2>nul
del /q DEPLOYMENT_CHECKLIST.md 2>nul
del /q DEPLOYMENT_SUMMARY.md 2>nul
del /q EXPO_PASSWORD_SETUP.md 2>nul
del /q FIX_BUNDLE_FREEZE.md 2>nul
del /q GITHUB_BUILD_GUIDE.md 2>nul
del /q GITHUB_SETUP_AUTOMATICO.md 2>nul
del /q JAVA_SETUP_GUIDE.md 2>nul
del /q NEXT_STEPS.md 2>nul
del /q QUICK_APK_BUILD.md 2>nul
del /q SETUP_GITHUB_REPO.md 2>nul
del /q STORE_SUBMISSION_GUIDE.md 2>nul

echo Removendo scripts de build antigos...
del /q build-alternative.bat 2>nul
del /q build-apk.bat 2>nul
del /q final-build.bat 2>nul
del /q get-expo-token.js 2>nul

echo Removendo diretorios temporarios...
if exist temp-build rmdir /s /q temp-build 2>nul
if exist dist rmdir /s /q dist 2>nul
if exist .git rmdir /s /q .git 2>nul
if exist .github rmdir /s /q .github 2>nul

echo Removendo arquivos de configuracao desnecessarios...
del /q .easignore 2>nul
del /q eas-simple.json 2>nul

echo Limpando cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo Limpeza concluida!
echo.
echo Arquivos mantidos para build:
echo - Codigo fonte (src/)
echo - Assets (assets/)
echo - Configuracoes essenciais (package.json, app.json, etc.)
echo - Scripts de build (build-apk-final.bat)
echo - Configuracao Android (android/)
echo.
pause