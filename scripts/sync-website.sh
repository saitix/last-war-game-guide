#!/bin/bash

set -euo pipefail

DEFAULT_URL="https://www.lastwartutorial.com/"
URL="${1:-$DEFAULT_URL}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/mirror"
LOG_FILE="${LOG_FILE:-$PROJECT_DIR/httrack-sync.log}"
SOURCE_URL_FILE="$PROJECT_DIR/.mirror-source-url"

mkdir -p "$PROJECT_DIR"

normalize_url() {
    local value="${1:-}"
    printf '%s\n' "${value%/}"
}

resolve_canonical_url() {
    local requested_url="$1"
    local effective_url

    effective_url="$(curl -fsSLo /dev/null -w '%{url_effective}' "$requested_url")"
    if [ -z "$effective_url" ]; then
        echo "Failed to resolve canonical URL for $requested_url" >&2
        exit 1
    fi

    printf '%s/\n' "$(normalize_url "$effective_url")"
}

url_host() {
    local value
    value="$(normalize_url "$1")"
    value="${value#http://}"
    value="${value#https://}"
    printf '%s\n' "${value%%/*}"
}

write_root_index() {
    local site_host="$1"

    cat > "$PROJECT_DIR/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Last War Tutorial mirror</title>
  <meta http-equiv="refresh" content="0; url=./${site_host}/index.html">
</head>
<body>
  <p>Opening the local mirror… <a href="./${site_host}/index.html">Continue</a></p>
</body>
</html>
EOF
}

if pgrep -x "httrack" > /dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Sync skipped: HTTrack is already running." >> "$LOG_FILE"
    exit 1
fi

CANONICAL_URL="$(resolve_canonical_url "$URL")"
CANONICAL_HOST="$(url_host "$CANONICAL_URL")"
CACHED_URL=""

if [ -f "$PROJECT_DIR/hts-cache/doit.log" ]; then
    CACHED_URL="$(awk 'NR==1 { print $1 }' "$PROJECT_DIR/hts-cache/doit.log")"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting website synchronization for $URL (canonical: $CANONICAL_URL)..." >> "$LOG_FILE"

if [ -n "$CACHED_URL" ] && [ "$(normalize_url "$CACHED_URL")" != "$(normalize_url "$CANONICAL_URL")" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Resetting mirror cache because the source URL changed from $CACHED_URL to $CANONICAL_URL." >> "$LOG_FILE"
    find "$PROJECT_DIR" -mindepth 1 -maxdepth 1 ! -name "$(basename "$LOG_FILE")" -exec rm -rf -- {} +
fi

cd "$PROJECT_DIR"

if [ -d "hts-cache" ]; then
    httrack "$CANONICAL_URL" -O "$PROJECT_DIR" --update -I0 >> "$LOG_FILE" 2>&1
else
    httrack "$CANONICAL_URL" -O "$PROJECT_DIR" -I0 >> "$LOG_FILE" 2>&1
fi

printf '%s\n' "$CANONICAL_URL" > "$SOURCE_URL_FILE"

if [ ! -f "$PROJECT_DIR/$CANONICAL_HOST/index.html" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Synchronization failed: expected $PROJECT_DIR/$CANONICAL_HOST/index.html to exist." >> "$LOG_FILE"
    exit 1
fi

write_root_index "$CANONICAL_HOST"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Synchronization complete." >> "$LOG_FILE"
