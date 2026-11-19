@echo off
chcp 65001 >nul
title Герои Одного Дома - остановка
cd /d "%~dp0"
echo Останавливаю сайт "Герои Одного Дома"...
docker compose down
echo.
echo Готово. Данные сохранены (папка data), при следующем запуске всё вернётся.
echo.
pause
