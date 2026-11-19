#!/usr/bin/env bash
# Запуск сайта одной командой (Linux и macOS): ./start.sh
set -u
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Не найден Docker. Установите Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker не запущен."
  if [ "$(uname)" = "Darwin" ]; then
    echo "Запускаю Docker Desktop, подождите (до 3 минут)..."
    open -a Docker
    for _ in $(seq 1 36); do docker info >/dev/null 2>&1 && break; sleep 5; done
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "Запустите Docker и повторите."
    exit 1
  fi
fi

echo "Запускаю сайт (в первый раз это занимает несколько минут)..."
docker compose up -d --build || { echo "Не удалось запустить. Журнал: docker compose logs --tail 50"; exit 1; }

echo "Жду, пока сайт ответит..."
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:3000 && break; sleep 2; done

IP="$( (hostname -I 2>/dev/null | awk '{print $1}') || true )"
[ -z "$IP" ] && IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
echo
echo "ГОТОВО! Сайт работает."
echo "  На этом компьютере:    http://localhost:3000"
if [ -n "$IP" ]; then
  echo "  Телефон (та же Wi-Fi): http://$IP:3000"
  echo "  Телевизор:             http://$IP:3000/tv"
fi
echo "Адрес вводите с http:// (не https). Остановить сайт: docker compose down"

if command -v open >/dev/null 2>&1; then open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000 >/dev/null 2>&1 || true
fi
