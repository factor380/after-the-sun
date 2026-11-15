#!/usr/bin/env bash
# `next build` for this app.
#
# Google Fonts sometimes answers with an extensionless `/l/font?kit=` URL.
# Next.js 16.2 treats that HTTP 200 as final and Turbopack then fails with
# "next/font/google queries have exactly one entry". A new request usually
# returns a normal .woff2 URL, so only that failure is retried.
set -euo pipefail
cd "$(dirname "$0")/.."

max=3
attempt=1
while [[ "$attempt" -le "$max" ]]; do
  log="$(mktemp)"
  set +e
  set +o pipefail
  ./node_modules/.bin/next build 2>&1 | tee "$log"
  status=${PIPESTATUS[0]}
  set -o pipefail
  set -e
  if [[ "$status" -eq 0 ]]; then
    rm -f "$log"
    exit 0
  fi
  if [[ "$attempt" -lt "$max" ]] && grep -q "next/font/google queries have exactly one entry" "$log"; then
    echo "next build: Google Fonts returned an extensionless font URL (attempt ${attempt}/${max}). Retrying." >&2
    rm -rf .next
    rm -f "$log"
    attempt=$((attempt + 1))
    continue
  fi
  rm -f "$log"
  exit "$status"
done
