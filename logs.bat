@echo off
chcp 65001 >nul
title Семья Легенд - проверка (почему не запускается)
cd /d "%~dp0"

echo.
echo  ===== Проверка: почему не запускается сайт =====
echo.
echo  Папка: %CD%
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo  [!] Docker не найден. Установите Docker Desktop и перезагрузите компьютер.
  goto end
)
docker info >nul 2>&1
if errorlevel 1 (
  echo  [!] Docker Desktop не запущен. Откройте его, дождитесь "Engine running" и запустите start.bat.
  goto end
)
echo  Docker работает.
echo.
echo  --- Контейнеры ---
docker compose ps -a
echo.
echo  --- Последние сообщения сайта (ошибка обычно в конце) ---
docker compose logs --tail 60
echo.
echo  --- Свободное место на диске (папка проекта) ---
for %%d in ("%CD%") do echo  Диск %%~dd
dir /-c "%~dp0" | find "свободно"
echo.
echo  Если видите красные ошибки, сделайте снимок этого окна и пришлите.

:end
echo.
pause
