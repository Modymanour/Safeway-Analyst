#!/bin/sh
set -eu

: "${POSTGRES_USER:?POSTGRES_USER must be set}"
: "${POSTGRES_DB:?POSTGRES_DB must be set}"
: "${PGPASSWORD:?PGPASSWORD must be set}"

BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"

umask 077
mkdir -p /backups

while true; do
  timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
  backup_file="/backups/safeway-$timestamp.sql"
  temp_file="$backup_file.tmp"

  if pg_dump --no-password --host=db --port=5432 --username="$POSTGRES_USER" "$POSTGRES_DB" > "$temp_file"; then
    mv "$temp_file" "$backup_file"
    echo "Postgres backup saved: $backup_file"
    find /backups -type f -name 'safeway-*.sql' -mtime "+$BACKUP_KEEP_DAYS" -delete
  else
    rm -f "$temp_file"
    echo 'Postgres backup failed; will retry after the configured interval.' >&2
  fi

  sleep "$BACKUP_INTERVAL_SECONDS"
done
