@echo off
chcp 65001 >nul
title Мой рост - запуск
cd /d "%~dp0"

echo.
echo  ===== Мой рост: запуск сайта =====
echo.

where docker >nul 2>&1
if errorlevel 1 goto nodocker

docker info >nul 2>&1
if not errorlevel 1 goto ready

echo Docker Desktop не запущен. Запускаю его, подождите (до 3 минут)...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
set /a tries=0

:wait
docker info >nul 2>&1
if not errorlevel 1 goto ready
set /a tries+=1
if %tries% geq 36 goto timeout
timeout /t 5 /nobreak >nul
goto wait

:ready
echo Docker готов. Запускаю сайт (в первый раз это занимает несколько минут)...
echo.
docker compose up -d --build
if errorlevel 1 goto failed

echo.
echo Жду, пока сайт ответит...
set /a n=0
:ping
curl.exe -s -o nul http://localhost:3000
if not errorlevel 1 goto up
set /a n+=1
if %n% geq 30 goto up
timeout /t 2 /nobreak >nul
goto ping

:up
set "IP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\ip.ps1"`) do set "IP=%%i"

echo.
echo  ГОТОВО! Сайт работает.
echo.
echo  На этом компьютере:    http://localhost:3000
if defined IP echo  Телефон (та же Wi-Fi): http://%IP%:3000
if defined IP echo  Телевизор:             http://%IP%:3000/tv
echo.
echo  Адрес вводите с http:// (не https). Это окно можно закрыть: сайт продолжит работать.
echo  Остановить сайт: запустите stop.bat
echo.
start "" http://localhost:3000
pause
exit /b 0

:nodocker
echo Не найден Docker. Установите Docker Desktop:
echo https://www.docker.com/products/docker-desktop/
echo После установки перезагрузите компьютер и запустите этот файл снова.
echo.
pause
exit /b 1

:timeout
echo Docker Desktop так и не запустился. Откройте его вручную, дождитесь
echo зелёного значка "Engine running" и запустите этот файл снова.
echo.
pause
exit /b 1

:failed
echo.
echo Не удалось запустить сайт. Подробности выше. Можно посмотреть журнал командой:
echo     docker compose logs --tail 50
echo.
pause
exit /b 1
