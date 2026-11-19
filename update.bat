@echo off
rem Файл копирует сам себя во временную папку и работает оттуда: так его можно безопасно обновлять через git.
if "%~1"=="--run" goto main
copy /y "%~f0" "%TEMP%\legend-update.bat" >nul
call "%TEMP%\legend-update.bat" --run "%~dp0"
exit /b %errorlevel%

:main
chcp 65001 >nul
title Семья Легенд - обновление
set "PROJ=%~2"
cd /d "%PROJ%"
set "BRANCH=claude/funny-turing-c8yf95"
set "REPO=https://github.com/Artemkochubey/repo-girhab.git"

echo.
echo  ===== Семья Легенд: обновление и запуск =====
echo.

where git >nul 2>&1
if errorlevel 1 goto nogit

if exist ".git" goto pull

echo Папка не связана с репозиторием, подключаю. Ваши данные (папка data) не затрагиваются.
git -c safe.directory=* init -q
git -c safe.directory=* remote add origin %REPO%
git -c safe.directory=* fetch origin %BRANCH%
if errorlevel 1 goto failed
git -c safe.directory=* checkout -f -B %BRANCH% origin/%BRANCH%
if errorlevel 1 goto failed
git -c safe.directory=* branch --set-upstream-to=origin/%BRANCH% >nul 2>&1
goto launch

:pull
echo Скачиваю обновление...
git -c safe.directory=* pull
if not errorlevel 1 goto launch

echo.
echo Обычное обновление не получилось, пробую принудительно (данные в папке data не затрагиваются)...
git -c safe.directory=* fetch origin %BRANCH%
if errorlevel 1 goto failed
git -c safe.directory=* reset --hard origin/%BRANCH%
if errorlevel 1 goto failed

:launch
echo.
echo Обновление скачано. Запускаю сайт...
call "%PROJ%start.bat"
exit /b 0

:nogit
echo Не найден Git. Установите его: https://git-scm.com/download/win
echo После установки закройте это окно и запустите update.bat снова.
echo.
pause
exit /b 1

:failed
echo.
echo Не удалось скачать обновление. Проверьте интернет и запустите update.bat снова.
echo Если ошибка повторяется, сделайте снимок этого окна и пришлите разработчику.
echo.
pause
exit /b 1
