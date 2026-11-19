@echo off
chcp 65001 >nul
title Семья Легенд - копия данных
cd /d "%~dp0"

echo.
echo  ===== Семья Легенд: копия данных =====
echo.

docker compose exec -T app npm run db:backup
if errorlevel 1 goto failed

echo.
echo Готово. Копии лежат в папке data\backups (хранятся последние 14).
echo Скопируйте её на другой диск или в облако, чтобы данные не пропали при поломке диска.
if exist "%~dp0data\backups" explorer "%~dp0data\backups"
echo.
pause
exit /b 0

:failed
echo.
echo Не получилось сделать копию. Сайт должен быть запущен: сначала start.bat.
echo.
pause
exit /b 1
