@echo off
chcp 65001 >nul
title Семья Легенд - остановка
cd /d "%~dp0"
echo Останавливаю сайт "Семья Легенд"...
docker compose down
echo.
echo Готово. Данные сохранены (папка data), при следующем запуске всё вернётся.
echo.
pause
