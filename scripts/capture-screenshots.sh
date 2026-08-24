#!/bin/bash
# Capture App Store screenshots from the iOS simulator at exact 6.9" size
# (1320 x 2868). The app is a Capacitor shell around the live site, so we point
# its server.url at one route at a time and relaunch — no tapping needed.
set -e

SIM="${SIM:-3BC83D67-F889-416B-9738-3EAADCAEA6D2}"
BUNDLE="com.sgspellingbuddy.app"
SITE="https://www.sgspellingbuddy.com"
OUT="$(cd "$(dirname "$0")/.." && pwd)/appstore-screenshots"
mkdir -p "$OUT"

CONTAINER=$(xcrun simctl get_app_container "$SIM" "$BUNDLE" app)
CFG="$CONTAINER/capacitor.config.json"
[ -f "$CFG.orig" ] || cp "$CFG" "$CFG.orig"

shoot() {          # shoot <name> <path> [wait]
  local name="$1" path="$2" wait="${3:-9}"
  python3 - "$CFG" "$SITE$path" <<'PY'
import json, sys
cfg_path, url = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_path))
cfg["server"]["url"] = url
json.dump(cfg, open(cfg_path, "w"), indent=2, ensure_ascii=False)
PY
  xcrun simctl terminate "$SIM" "$BUNDLE" >/dev/null 2>&1 || true
  xcrun simctl launch "$SIM" "$BUNDLE" >/dev/null
  sleep "$wait"
  xcrun simctl io "$SIM" screenshot "$OUT/$name.png" >/dev/null 2>&1
  echo "  ✓ $name  ($path)"
}

echo "Capturing…"
shoot 01-parent-home   "/parent/dashboard"
shoot 02-import        "/parent/import"
shoot 03-student-home  "/student/dashboard"
shoot 04-learn         "/student/learn?list=list-1"  11
shoot 05-test          "/student/test?list=list-1"   11
shoot 06-ai-grade      "/student/handwriting?list=list-1&child=child-1"

# restore the shipped config so the bundle isn't left pointing at a sub-page
cp "$CFG.orig" "$CFG"
xcrun simctl terminate "$SIM" "$BUNDLE" >/dev/null 2>&1 || true
echo "Done → $OUT"
