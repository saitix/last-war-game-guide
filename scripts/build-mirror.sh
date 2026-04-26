#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIRROR_DIR="$PROJECT_ROOT/mirror"
DIST_DIR="$PROJECT_ROOT/dist"
SOURCE_URL_FILE="$MIRROR_DIR/.mirror-source-url"
CACHE_LOG_FILE="$MIRROR_DIR/hts-cache/doit.log"

normalize_url() {
    local value="${1:-}"
    printf '%s\n' "${value%/}"
}

url_host() {
    local value
    value="$(normalize_url "$1")"
    value="${value#http://}"
    value="${value#https://}"
    printf '%s\n' "${value%%/*}"
}

SOURCE_URL=""
if [ -f "$SOURCE_URL_FILE" ]; then
    SOURCE_URL="$(cat "$SOURCE_URL_FILE")"
elif [ -f "$CACHE_LOG_FILE" ]; then
    SOURCE_URL="$(awk 'NR==1 { print $1 }' "$CACHE_LOG_FILE")"
fi

if [ -z "$SOURCE_URL" ]; then
    echo "Mirror metadata is missing. Run scripts/sync-website.sh before building." >&2
    exit 1
fi

SITE_HOST="$(url_host "$SOURCE_URL")"
SITE_DIR="$MIRROR_DIR/$SITE_HOST"
SITE_INDEX="$SITE_DIR/index.html"

if [ ! -f "$SITE_INDEX" ]; then
    echo "Mirror site index is missing at $SITE_INDEX. Run scripts/sync-website.sh before building." >&2
    exit 1
fi

if grep -q 'URL=index.html' "$SITE_INDEX"; then
    echo "Mirror index is still the broken HTTrack redirect placeholder. Re-run scripts/sync-website.sh to refresh the canonical mirror." >&2
    exit 1
fi

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
cp -a "$SITE_DIR"/. "$DIST_DIR"/

echo "Built dist/ from mirror source $SITE_HOST"
