#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIRROR_DIR="$PROJECT_ROOT/mirror"
DIST_DIR="$PROJECT_ROOT/dist"
SOURCE_URL_FILE="$MIRROR_DIR/mirror-source-url"
CACHE_LOG_FILE="$MIRROR_DIR/hts-cache/doit.log"
SYNC_SCRIPT="$SCRIPT_DIR/sync-website.sh"

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

if [ ! -f "$SOURCE_URL_FILE" ]; then
	echo "Mirror source list is missing at $SOURCE_URL_FILE." >&2
	echo "Create the file with one URL per line, then rerun this script." >&2
	exit 1
fi

if [ ! -x "$SYNC_SCRIPT" ]; then
	echo "Sync script not found or not executable at $SYNC_SCRIPT." >&2
	exit 1
fi


echo "Section 1"
# Run sync-website.sh once per non-empty / non-comment line in SOURCE_URL_FILE,
# then validate that the resulting per-site index.html exists and is real.
# A failure on a single URL is recorded and the loop keeps going so that one
# bad source doesn't block the rest of the mirror.
SYNCED_COUNT=0
FAILED_URLS=()
while IFS= read -r url || [ -n "$url" ]; do
	# Trim surrounding whitespace
	url="${url#"${url%%[![:space:]]*}"}"
	url="${url%"${url##*[![:space:]]}"}"
	# Skip blanks and comments
	[ -z "$url" ] && continue
	case "$url" in \#*) continue ;; esac

	echo "Syncing mirror source: $url"
	# `if !` is exempt from `set -e`, so a non-zero exit from sync-website.sh
	# won't abort build-mirror.sh — we record it and move on to the next URL.
	if ! "$SYNC_SCRIPT" "$url"; then
		echo "  Sync failed for $url (continuing with remaining sources)." >&2
		FAILED_URLS+=("$url")
		continue
	fi

	SITE_HOST="$(url_host "$url")"
	SITE_DIR="$MIRROR_DIR/$SITE_HOST"
	SITE_INDEX="$SITE_DIR/index.html"

	if [ ! -f "$SITE_INDEX" ]; then
		echo "  Mirror site index is missing at $SITE_INDEX (continuing)." >&2
		FAILED_URLS+=("$url")
		continue
	fi

	if grep -q 'URL=index.html' "$SITE_INDEX"; then
		echo "  Mirror index for $url is still the broken HTTrack redirect placeholder (continuing)." >&2
		FAILED_URLS+=("$url")
		continue
	fi

	SYNCED_COUNT=$((SYNCED_COUNT + 1))
done <"$SOURCE_URL_FILE"


# Failure info
if [ "$SYNCED_COUNT" -eq 0 ]; then
	echo "No URLs were successfully mirrored from $SOURCE_URL_FILE." >&2
	if [ ${#FAILED_URLS[@]} -gt 0 ]; then
		echo "Failed sources:" >&2
		printf '  - %s\n' "${FAILED_URLS[@]}" >&2
	fi
fi

if [ ${#FAILED_URLS[@]} -gt 0 ]; then
	echo "Warning: ${#FAILED_URLS[@]} source(s) failed to mirror:" >&2
	printf '  - %s\n' "${FAILED_URLS[@]}" >&2
fi


# Repair HTTrack misses on WordPress image assets before the Fandom dump runs.
# We see two recurring issues in the mirrored HTML:
#   1. <img src> is sometimes rewritten to `.../image-120.html` even though the
#      real downloaded file is `image-120.png`
#   2. srcset candidates like `image-120-213x300.png` are referenced in HTML
#      but never downloaded, even when the original `image-120.png` exists
#
# The repair step below scans mirrored HTML for local wp-content upload image
# references, rewrites `.html` image URLs back to the real local asset when the
# base image is available, and materializes missing srcset derivatives by
# copying the original image to the expected local filename. This keeps the
# packaged raw mirror browseable offline even when HTTrack skipped those URLs.
echo "Section 1.5"
python3 - "$MIRROR_DIR" <<'PY'
import html
import os
import re
import shutil
import sys
from pathlib import Path

mirror_dir = Path(sys.argv[1]).resolve()
host_root = mirror_dir / "www.lastwartutorial.com"

if not host_root.exists():
    print(f"WordPress mirror root is missing at {host_root}; skipping image repair.", file=sys.stderr)
    raise SystemExit(0)

img_attr_re = re.compile(r'(?P<attr>\b(?:src|href|srcset)\b)\s*=\s*(?P<quote>["\'])(?P<value>.*?)(?P=quote)', re.IGNORECASE)
upload_image_re = re.compile(r'(?P<prefix>(?:\.\./|/)?wp-content/uploads/[^"\'\s,?#>]+\.(?:png|jpe?g|webp|gif|svg))', re.IGNORECASE)
html_image_re = re.compile(r'(?P<prefix>(?:\.\./|/)?wp-content/uploads/[^"\'\s,?#>]+)\.html(?P<suffix>(?:[?#][^"\']*)?)$', re.IGNORECASE)
image_suffixes = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")

fixed_html_refs = 0
materialized_variants = 0


def normalize_rel_path(value: str) -> str:
    value = html.unescape(value).strip()
    value = value.split("?", 1)[0].split("#", 1)[0]
    if value.startswith("https://www.lastwartutorial.com/"):
        value = value.removeprefix("https://www.lastwartutorial.com/")
    elif value.startswith("http://www.lastwartutorial.com/"):
        value = value.removeprefix("http://www.lastwartutorial.com/")
    elif value.startswith("/"):
        value = value[1:]
    while value.startswith("../"):
        value = value[3:]
    return value


def find_existing_base_asset(base_without_suffix: str) -> str | None:
    for suffix in image_suffixes:
        candidate = host_root / f"{base_without_suffix}{suffix}"
        if candidate.is_file():
            return candidate.as_posix()
    return None


def rewrite_html_image_ref(value: str) -> str:
    global fixed_html_refs

    match = html_image_re.search(value)
    if not match:
        return value

    normalized = normalize_rel_path(match.group("prefix"))
    base_asset = find_existing_base_asset(normalized)
    if not base_asset:
        return value

    relative_base = os.path.relpath(base_asset, host_root).replace(os.sep, "/")
    replacement = value[: match.start("prefix")] + "../" + relative_base + (match.group("suffix") or "")
    if replacement != value:
        fixed_html_refs += 1
    return replacement


def ensure_variant_exists(raw_ref: str) -> None:
    global materialized_variants

    normalized = normalize_rel_path(raw_ref)
    if not normalized.startswith("wp-content/uploads/"):
        return

    target = host_root / normalized
    if target.exists():
        return

    stem, ext = os.path.splitext(normalized)
    size_match = re.search(r"^(?P<base>.+)-\d+x\d+$", stem)
    if not size_match:
        return

    source = host_root / f"{size_match.group('base')}{ext}"
    if not source.is_file():
        return

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    materialized_variants += 1


for html_path in host_root.rglob("*.html"):
    original = html_path.read_text(encoding="utf-8", errors="ignore")

    def replace_attr(match: re.Match[str]) -> str:
        attr = match.group("attr")
        quote = match.group("quote")
        value = match.group("value")
        new_value = rewrite_html_image_ref(value)

        for candidate in upload_image_re.findall(new_value):
            ensure_variant_exists(candidate)

        if attr.lower() == "srcset":
            for entry in new_value.split(","):
                candidate = entry.strip().split(" ", 1)[0]
                if candidate:
                    ensure_variant_exists(candidate)

        return f'{attr}={quote}{new_value}{quote}'

    rewritten = img_attr_re.sub(replace_attr, original)
    if rewritten != original:
        html_path.write_text(rewritten, encoding="utf-8")

print(
    f"Repaired WordPress image refs: {fixed_html_refs} rewritten HTML refs, "
    f"{materialized_variants} missing variants materialized."
)
PY


echo "Section 2"
# ---------------------------------------------------------------------------
# Section 2: Fandom dump (JS-rendered, mirrored via Playwright + MediaWiki API)
# ---------------------------------------------------------------------------
# HTTrack cannot mirror Fandom because article content is injected client-side.
# We use scripts/dump-fandom.cjs (Playwright + Chromium for the index page,
# MediaWiki `action=parse` API for each linked article) and dump the result
# into mirror/fandom/<section>/.
#
# Each entry below is "<index_url>|<output_subdir>".
DUMP_FANDOM_SCRIPT="$SCRIPT_DIR/dump-fandom.cjs"
FANDOM_TARGETS=(
	"https://last-war-survival.fandom.com/wiki/Heroes|fandom/heroes"
)

if [ ${#FANDOM_TARGETS[@]} -gt 0 ]; then
	if [ ! -f "$DUMP_FANDOM_SCRIPT" ]; then
		echo "Fandom dump script not found at $DUMP_FANDOM_SCRIPT." >&2
		exit 1
	fi

	if ! command -v node >/dev/null 2>&1; then
		echo "node is required for the Fandom dump but was not found in PATH." >&2
		exit 1
	fi

	# Verify Playwright (the npm package) is installed and resolvable from the
	# project root. `node -e "require.resolve('playwright')"` exits non-zero
	# if the module cannot be found.
	if ! (cd "$PROJECT_ROOT" && node -e "require.resolve('playwright')" >/dev/null 2>&1); then
		echo "The 'playwright' npm package is not installed in $PROJECT_ROOT." >&2
		echo "Install it with: (cd $PROJECT_ROOT && npm install --save-dev playwright)" >&2
		exit 1
	fi

	# Verify Playwright's Chromium browser is installed. `playwright install
	# --dry-run chromium` lists what *would* be installed; if Chromium is
	# already present its line is prefixed with "browser: ... is already
	# installed" / similar wording, depending on the Playwright version. The
	# safer cross-version check is to ask Playwright for the executable path
	# and confirm the file exists on disk.
	CHROMIUM_PATH="$(cd "$PROJECT_ROOT" && node -e "process.stdout.write(require('playwright').chromium.executablePath())" 2>/dev/null || true)"
	if [ -z "$CHROMIUM_PATH" ] || [ ! -x "$CHROMIUM_PATH" ]; then
		echo "Playwright's Chromium browser is not installed (expected at: ${CHROMIUM_PATH:-<unknown>})." >&2
		echo "Install it with: (cd $PROJECT_ROOT && npx playwright install chromium)" >&2
		exit 1
	fi

	for entry in "${FANDOM_TARGETS[@]}"; do
		index_url="${entry%%|*}"
		out_subdir="${entry#*|}"
		out_dir="$MIRROR_DIR/$out_subdir"

		echo "Dumping Fandom: $index_url -> $out_dir"
		mkdir -p "$out_dir"
		(cd "$PROJECT_ROOT" && node "$DUMP_FANDOM_SCRIPT" "$index_url" "$out_dir")

		if [ ! -f "$out_dir/index.html" ]; then
			echo "Fandom dump failed: $out_dir/index.html was not produced." >&2
			exit 1
		fi
	done
fi
