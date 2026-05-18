#!/usr/bin/env bash
# Greps case-sensitive "Hyrox" across user-facing source dirs. Exits 1 if any
# match is found, prints file:line per match. See CLAUDE.md for the trademark
# rule and approved replacements.

set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR" || exit 2

# Directories to scan. Anything user-facing should live in one of these.
SCAN_DIRS=(app components lib data assets constants)

# Drop dirs that don't exist (e.g., assets is binary-only on some checkouts —
# grep handles missing paths but we want clean output, not warnings).
EXISTING_DIRS=()
for d in "${SCAN_DIRS[@]}"; do
  [ -d "$d" ] && EXISTING_DIRS+=("$d")
done

if [ ${#EXISTING_DIRS[@]} -eq 0 ]; then
  echo "check-hyrox: no scannable dirs found from project root ($ROOT_DIR)" >&2
  exit 2
fi

# Case-sensitive (no -i), recurse, file:line output (-n -H), include only the
# file types we care about. Exclude node_modules, .git, .expo, the script
# itself, and CLAUDE.md (which legitimately discusses the rule).
MATCHES=$(grep -rn \
  --include='*.ts' \
  --include='*.tsx' \
  --include='*.json' \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.expo \
  --exclude-dir=.expo-shared \
  --exclude-dir=dist \
  --exclude-dir=ios \
  --exclude-dir=android \
  'Hyrox' "${EXISTING_DIRS[@]}" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "check-hyrox: 'Hyrox' is a registered trademark; remove from user-facing copy."
  echo "(See CLAUDE.md for approved replacements.)"
  echo ""
  echo "$MATCHES"
  exit 1
fi

echo "check-hyrox: clean."
exit 0
