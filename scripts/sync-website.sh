#!/bin/bash

set -euo pipefail

DEFAULT_URL="https://www.lastwartutorial.com/"
URL="${1:-$DEFAULT_URL}"

# Hard cap on how long a single sync may run, in seconds. Override by exporting
# MAX_SYNC_SECONDS before invoking the script. Defaults to 30 minutes — well
# above a normal incremental update but short enough that a stuck httrack
# session can't sit there for hours.
MAX_SYNC_SECONDS="${MAX_SYNC_SECONDS:-1800}"

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

# httrack flag notes:
#   -I0                      do not generate the global index.html
#   --stay-on-same-address   restrict crawling to the same hostname
#   --advanced-progressinfo  more verbose progress info in the log
#   -E<seconds>              httrack-internal max session time (soft limit)
#
# We additionally wrap the call in `timeout` as a hard kill switch, since
# httrack has been observed to hang well past its own --max-time on slow
# servers.
HTTRACK_COMMON=(
    -O "$PROJECT_DIR"
    -I0
    --stay-on-same-address
    --advanced-progressinfo
    "-E${MAX_SYNC_SECONDS}"
)

# URL exclusion filters. httrack scan rules use `-pattern` to skip and `*`
# as a wildcard. These bogus paths consistently produce 403/404s on
# WordPress sites (see mirror/hts-log.txt) and were the source of the
# previous runaway crawl:
#   /xmlrpc.php           WordPress XML-RPC endpoint, always 403/forbidden
#   */Edg/                garbage path injected from "Edg" UA token parsing
#   */+/                  garbage path from a Google "+" handler
#   */GET                 garbage path from a malformed link
#   *?p=NNNN              WordPress short-link IDs that 301-redirect to the
#                         canonical slug — fetching them just duplicates work
#   *?replytocom=*        WordPress comment-reply links — combinatorial trap
#   */wp-json/*           REST API endpoints, not browseable HTML
#   */wp-login.php*       login forms / endless redirect to wp-admin
#   */wp-admin/*          admin area, requires auth, also 403s
#   */feed/*              RSS feeds duplicate every page
#   */trackback/*         pingback endpoints
#   */comments/feed/*     per-post comment feeds
HTTRACK_FILTERS=(
    '-*/xmlrpc.php*'
    '-*/Edg/*'
    '-*/+/*'
    '-*/GET'
    '-*?p=*'
    '-*?replytocom=*'
    '-*/wp-json/*'
    '-*/wp-login.php*'
    '-*/wp-admin/*'
    '-*/feed/*'
    '-*/trackback/*'
    '-*/comments/feed/*'
)

run_httrack() {
    # `timeout --kill-after=30s ...` sends SIGTERM after MAX_SYNC_SECONDS, then
    # SIGKILL 30s later if httrack hasn't exited. Output is appended to the log.
    timeout --kill-after=30s "${MAX_SYNC_SECONDS}s" httrack "$@" >> "$LOG_FILE" 2>&1
    local rc=$?
    if [ "$rc" -eq 124 ] || [ "$rc" -eq 137 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Sync aborted: httrack exceeded ${MAX_SYNC_SECONDS}s and was killed (exit $rc)." >> "$LOG_FILE"
    fi
    return "$rc"
}

if [ -d "hts-cache" ]; then
    run_httrack "$CANONICAL_URL" "${HTTRACK_COMMON[@]}" --update --repair-cache "${HTTRACK_FILTERS[@]}"
else
    run_httrack "$CANONICAL_URL" "${HTTRACK_COMMON[@]}" "${HTTRACK_FILTERS[@]}"
fi

if [ ! -f "$PROJECT_DIR/$CANONICAL_HOST/index.html" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Synchronization failed: expected $PROJECT_DIR/$CANONICAL_HOST/index.html to exist." >> "$LOG_FILE"
    exit 1
fi

write_root_index "$CANONICAL_HOST"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Synchronization complete." >> "$LOG_FILE"
