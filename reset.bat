@echo off
echo Matando processos Node.js...
taskkill /F /IM node.exe
taskkill /F /IM npm.cmd

echo Limpando cache...
rmdir /s /q node_modules\.vite
npm cache clean --force

echo Reinstalando dependencias...
npm install

echo Iniciando servidor...
npm run dev 