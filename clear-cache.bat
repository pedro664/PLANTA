@echo off
echo Limpando cache do projeto...

echo Parando processos do Metro...
taskkill /f /im node.exe 2>nul

echo Limpando cache do npm...
npm start -- --clear-cache

echo Limpando cache do Expo...
npx expo r -c

echo Removendo node_modules...
if exist node_modules rmdir /s /q node_modules

echo Reinstalando dependencias...
npm install

echo Cache limpo! Execute 'npm start' para iniciar o projeto.
pause