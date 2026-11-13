@echo off
title PassMaster - Iniciar Proyecto
echo ========================================================
echo        Iniciando PassMaster (Sistema de Ticketing)
echo ========================================================
echo.
echo 1. Verificando inicio de servidores...
echo.

:: Iniciar Backend en una nueva ventana
start "PassMaster - Backend (API :5000)" cmd /k "cd /d D:\Proyecto final pow\backend && npm run dev"

:: Iniciar Frontend en una nueva ventana
start "PassMaster - Frontend (Web :5173)" cmd /k "cd /d D:\Proyecto final pow\frontend && npm run dev"

echo 2. Servidores en ejecucion:
echo    - Backend API: http://localhost:5000/api
echo    - Frontend Web: http://localhost:5173
echo.
echo 3. Abriendo aplicacion en tu navegador...
timeout /t 4 >nul
start http://localhost:5173

exit
