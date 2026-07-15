#!/usr/bin/env bash
# Reset the Cypress demo repo (Variant Z / Q / B) to the pristine PRE-PERCY state
# between recordings.
#
# Why pre-percy, not "fresh clone": Variant Z/Q's story is "a team that has never
# done visual testing." /percy:setup must have something to integrate, so the
# clean state is the commit BEFORE Percy was added (tag: pre-percy). A plain
# clone is NOT a valid zero-state unless origin/main is also at pre-percy — run
# once with --push-main to make that true.
#
# Does:
#   1. Closes any open non-dependabot PR against main + deletes its head branch
#      (local + remote) — cleans up whatever branch a take opened.
#   2. Checks out main, hard-resets it to the `pre-percy` tag, deletes leftover
#      local demo branches. This drops the integration commit's tracked files
#      (.percy.yml, CLAUDE.md, percySnapshot() lines, package.json deps).
#   3. Removes integration artifacts setup created untracked: .env, .percy/, and
#      (with --deep) node_modules so the SDK install happens on camera.
#   4. (opt-in --push-main) rewinds origin/main to pre-percy so a fresh clone is
#      also a valid zero-state. Best-effort; a permission block won't abort.
#
# Usage: ./scripts/reset-demo.sh [--deep] [--push-main]
#   --deep        also delete node_modules (forces a fresh npm install next run)
#   --push-main   also rewind origin/main to pre-percy (outward-facing; do once)
#
# Requires: gh CLI authenticated (gh auth status).
# Percy creds NOT needed — Z/Q builds its baseline locally during the demo;
# there is no persistent main build to keep approved.

set -euo pipefail

REPO="percy/example-percy-plugin-cypress"
CLEAN_TAG="pre-percy"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

DEEP=false
PUSH_MAIN=false
for arg in "$@"; do
  case "$arg" in
    --deep) DEEP=true;;
    --push-main) PUSH_MAIN=true;;
    *) echo "unknown arg: $arg" >&2; exit 2;;
  esac
done

echo "[reset] Freeing demo server port 5599 (kills stray http-server from a prior take)…"
lsof -ti :5599 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "[reset] Fetching refs + tags…"
git fetch --tags --prune origin >/dev/null 2>&1 || true

CLEAN_SHA=$(git rev-parse "refs/tags/$CLEAN_TAG" 2>/dev/null || true)
if [ -z "$CLEAN_SHA" ]; then
  echo "[reset] ERROR: tag '$CLEAN_TAG' not found. Create it: git tag pre-percy <pre-Percy-sha> && git push origin pre-percy" >&2
  exit 1
fi

echo "[reset] Closing open non-dependabot PRs against main…"
PRS=$(gh pr list --repo "$REPO" --base main --state open --json number,headRefName \
        --jq '.[] | "\(.number)\t\(.headRefName)"' 2>/dev/null || true)
if [ -n "$PRS" ]; then
  while IFS=$'\t' read -r NUM HEAD; do
    [ -z "$NUM" ] && continue
    case "$HEAD" in
      dependabot/*) echo "  - skip #$NUM ($HEAD) — not a demo branch"; continue;;
      main) continue;;
    esac
    echo "  - closing #$NUM ($HEAD) + deleting branch"
    gh pr close --repo "$REPO" "$NUM" --delete-branch >/dev/null 2>&1 || true
    git push origin --delete "$HEAD" >/dev/null 2>&1 || true
  done <<< "$PRS"
else
  echo "  - none."
fi

echo "[reset] Returning to main @ $CLEAN_TAG ($CLEAN_SHA)…"
git checkout -q main 2>/dev/null || git checkout -q -b main "$CLEAN_SHA"
git reset --hard "$CLEAN_SHA" >/dev/null

echo "[reset] Deleting leftover local demo branches…"
for b in $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -vx main | grep -v '^dependabot/'); do
  echo "  - $b"
  git branch -D "$b" >/dev/null 2>&1 || true
done

echo "[reset] Removing integration artifacts…"
rm -f .env .percy.yml .percy.config.yml 2>/dev/null || true
rm -rf .percy 2>/dev/null || true
git clean -fd >/dev/null 2>&1 || true   # untracked, non-ignored (leaves node_modules)
if $DEEP; then
  echo "  - --deep: removing node_modules"
  rm -rf node_modules
fi

if $PUSH_MAIN; then
  echo "[reset] Rewinding origin/main to $CLEAN_TAG (best-effort)…"
  if git push --force-with-lease origin "$CLEAN_SHA:refs/heads/main" >/dev/null 2>&1; then
    echo "  - origin/main rewound to pre-percy."
  else
    echo "  - WARNING: force-push blocked; trying gh api…" >&2
    gh api -X PATCH "repos/$REPO/git/refs/heads/main" -f sha="$CLEAN_SHA" -F force=true >/dev/null 2>&1 \
      && echo "  - origin/main rewound via gh api." \
      || echo "  - WARNING: could not rewind origin/main. Local reset stands; fresh clones stay integrated." >&2
  fi
fi

echo
echo "[reset] Clean. On branch main @ pre-percy (no Percy integrated):"
git log --oneline -1
if $DEEP; then
  echo "        Next: npm install (node_modules removed), then /percy:setup — runbook Variant Z/Q."
else
  echo "        Next: /percy:setup — runbook Variant Z/Q. (Add --deep to force an on-camera SDK install.)"
fi
