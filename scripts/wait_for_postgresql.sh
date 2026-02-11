#!/usr/bin/env bash
# simple wait-for-postgres (timeout 60s)
set -e

: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_USER:=$POSTGRES_USER}"
: "${POSTGRES_DB:=$POSTGRES_DB}"

TIMEOUT=60
WAIT=0

echo "Waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

until pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
  sleep 1
  WAIT=$((WAIT+1))
  if [ "$WAIT" -ge "$TIMEOUT" ]; then
    echo "Timed out waiting for Postgres"
    exit 1
  fi
done

echo "Postgres is ready"
