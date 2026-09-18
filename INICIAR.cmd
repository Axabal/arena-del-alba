@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 o posterior desde https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules\ws call npm.cmd ci --omit=dev
if errorlevel 1 (
  echo No se pudieron instalar las dependencias. Comprueba internet.
  pause
  exit /b 1
)
echo Abre http://localhost:3000 en tu navegador.
echo Manten esta ventana abierta mientras juegas.
node server/index.js
pause
