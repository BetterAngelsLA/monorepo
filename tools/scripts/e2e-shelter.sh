#!/usr/bin/env bash
# Runs the shelter-e2e suite against this branch's deployed preview.
#
# Kept in a script rather than inline in `.github/workflows/default.yml` so the
# same logic is runnable locally:
#
#   BASE_URL=https://…/branches/<branch>/ bash tools/scripts/e2e-shelter.sh
#   bash tools/scripts/e2e-shelter.sh        # this branch's preview, if any
#
# Previews are branch-scoped (`/branches/<branch>/`). A change that only touches
# the specs never rebuilds one, so the suite can be pointed at a preview that
# does not exist — that is a skip, not a failure. A missing branch path returns
# 403 and no `<base>`, so the probe checks both the status and the base path the
# served page was built with.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

run_suite() {
  # CI builds the `production` stage, which carries Chromium's system libraries
  # but not the browser binaries — that image is also the ECS task image and
  # never launches a browser. So this is a download on a CI run, and a no-op
  # where the dev image's copy is already in $HOME.
  yarn playwright install chromium
  exec yarn playwright test -c apps/shelter-e2e
}

# An explicit target wins: used locally, and it keeps the deployed-revision
# logic below out of the way.
if [ -n "${BASE_URL:-}" ]; then
  echo "▶ BASE_URL=$BASE_URL"
  run_suite
fi

affected="$(yarn nx show projects --affected)"

# `shelter-web` affected → the deploy step built and deployed this branch's
# preview, so it must be there. `shelter-e2e` affected → only the specs changed
# and the preview is whatever was deployed last, which may be nothing. Neither
# means the deploy had nothing to do.
deployed_here=false
if echo "$affected" | grep -qx shelter-web; then
  deployed_here=true
elif ! echo "$affected" | grep -qx shelter-e2e; then
  echo "⏭️  Neither shelter-web nor shelter-e2e is affected — the preview is unchanged, skipping e2e."
  exit 0
fi

# `SITE_URL` in the app's deploy env is the preview's public origin, so there
# is one place to change it.
origin="${PREVIEW_ORIGIN:-$(sed -n 's/^SITE_URL=//p' apps/shelter-web/.env.deploy.preview)}"
if [ -z "$origin" ]; then
  echo "❌ No preview origin: set PREVIEW_ORIGIN or add SITE_URL to apps/shelter-web/.env.deploy.preview." >&2
  exit 1
fi

base_path="/branches/${BRANCH_NAME:?BRANCH_NAME is required to locate the branch preview}/"
export BASE_URL="${origin%/}${base_path}"

echo "▶ Probing $BASE_URL"
body="$(mktemp)"
trap 'rm -f "$body"' EXIT
status="$(curl -sS -o "$body" -w '%{http_code}' --max-time 10 "$BASE_URL" || echo 000)"

if [ "$status" != 200 ] || ! grep -qF "base href=\"$base_path\"" "$body"; then
  if [ "$deployed_here" = true ]; then
    echo "❌ $BASE_URL (HTTP $status) is not serving this branch's build." >&2
    exit 1
  fi
  echo "⏭️  No preview for this branch at $BASE_URL (HTTP $status) — skipping e2e."
  exit 0
fi

run_suite
