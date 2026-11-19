#!/usr/bin/env bash
# Первая установка на сервере: спрашивает домен и пароль, создаёт deploy/Caddyfile и запускает сайт.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then read -rp "Домен сайта (например moyrost.duckdns.org): " DOMAIN; fi
if ! [[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then echo "Неверный домен: $DOMAIN" >&2; exit 1; fi

read -rp "Логин для входа на сайт [family]: " LOGIN
LOGIN="${LOGIN:-family}"
if ! [[ "$LOGIN" =~ ^[A-Za-z0-9_-]+$ ]]; then echo "Логин: только латинские буквы, цифры, - и _" >&2; exit 1; fi

read -rsp "Пароль (минимум 8 символов): " PASS; echo
if [ "${#PASS}" -lt 8 ]; then echo "Пароль короче 8 символов" >&2; exit 1; fi

HASH="$(docker run --rm caddy:2 caddy hash-password --plaintext "$PASS")"

cat > deploy/Caddyfile <<CADDY
$DOMAIN {
	encode gzip
	basic_auth {
		$LOGIN $HASH
	}
	reverse_proxy app:3000
}
CADDY

docker compose -f docker-compose.prod.yml up -d --build
echo
echo "Готово. Откройте https://$DOMAIN (логин: $LOGIN)."
echo "Первый запуск может занять минуту: Caddy получает сертификат."
