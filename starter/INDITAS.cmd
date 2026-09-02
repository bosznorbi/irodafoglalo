@echo off
setlocal
cd /d "%~dp0"
title Ketjatekos alap

where node >nul 2>nul
if errorlevel 1 goto nincsnode

echo.
echo   Indul a kiszolgalo, es megnyilik a bongeszo.
echo   Ezt az ablakot hagyd nyitva, amig jatszotok.
echo.
node server.js
echo.
echo   A kiszolgalo leallt.
pause
exit /b 0

:nincsnode
echo.
echo   NINCS TELEPITVE A NODE.JS
echo.
echo   Ez a starter egy kis helyi kiszolgalot hasznal, mert a bongeszo a
echo   JavaScript modulokat nem tolti be fajlrendszerrol (file:// cimrol).
echo.
echo   Telepitsd innen:  https://nodejs.org
echo   Utana futtasd ujra ezt a fajlt.
echo.
pause
exit /b 1
