#!/bin/bash
# Двойной щелчок на macOS: запускает сайт.
cd "$(dirname "$0")"
./start.sh
read -r -p "Нажмите Enter, чтобы закрыть окно..." _
