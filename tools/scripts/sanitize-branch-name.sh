#!/usr/bin/env sh
# Print the branch slug shared by EAS update branches and ECR image tags.
#
# Every workflow that names a branch has to agree on this value: the name
# `eas update` publishes to (handed to `tools/scripts/eas-update.mjs`) is the one
# the cleanup workflow deletes. Keeping a sed copy per workflow is how the cleanup
# ended up deleting `dependabot/uv/foo` while the update had published to
# `dependabot-uv-foo`, so it silently matched nothing for as long as it existed.
#
# Plain `sh`: `default.yml` needs this before `actions/setup-node` runs.
set -eu
printf '%s\n' "${1:-}" | sed 's|/|-|g' | sed 's|[^a-zA-Z0-9_.-]||g'
