@echo off
chcp 65001 >nul
title Мой рост - остановка
cd /d "%~dp0"
echo Останавливаю сайт "Мой рост"...
docker compose down
echo.
echo Готово. Данные сохранены (папка data), при следующем запуске всё вернётся.
echo.
pause
