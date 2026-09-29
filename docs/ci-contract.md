# CI contract

Two lanes, one contract. Branch protection, the security posture, and the
contributor docs all rely on the invariants below — keep them true when
editing workflows.

## Lanes

| Lane | Workflow | Triggers | Capabilities | Gating |
| --- | --- | --- | --- | --- |
| ✅ Checks | `.github/workflows/checks.yml` | every `pull_request` (incl. forks), `merge_group`, `push main` | none: no secrets, no OIDC, no registry auth, no write effects | **Required** status check (`checks`) |
| 🚀 Deploy | `.github/workflows/deploy.yml` | `push main`; `pull_request` from this repository only (`fork == false`) | AWS OIDC, ECR, `EXPO_TOKEN`, write `GITHUB_TOKEN` | not gating |
| 🚀 Full Run | `.github/workflows/pr-full-run.yml` | maintainer comment `/run-full` on a fork PR, or manual dispatch | AWS OIDC, ECR, `EXPO_TOKEN`, write `GITHUB_TOKEN` (preview scope) | not gating |

## Invariants

1. **Merge contract** — the required checks are exactly the checks that any
   provenance can satisfy with zero capabilities. Only `checks` may be required
   in branch protection.
2. **Capability rule** — capabilities are granted only to provenance that PR
   code cannot emit or alter: `push` to `main`, or `pull_request` from this
   repository. Workflow `if` guards are defense-in-depth, never the boundary:
   PR code can edit workflow files.
3. **No credentials on PR-reachable ground** — nothing triggered by
   `pull_request` may request `id-token`, hold a write token with effect, or
   read repository secrets. Fork runs are additionally covered by GitHub's
   read-only token and withheld secrets.
4. **Comms never gate** — PR comments and Slack are best-effort; they must
   degrade silently when permissions are missing.

## Merge queue

`merge_group` runs the ✅ Checks lane only. Queue entries can contain
PR-authored content (including workflow edits), so they must not receive
capabilities; deploys happen after merge, from `main`.

## Fork PRs

- Fork PRs get ✅ Checks (after a maintainer approves the workflow run).
- A maintainer can run the full pipeline (checks + web previews + EAS preview)
  on a fork PR revision by commenting `/run-full`. The gate lives in
  `pr-full-run.yml` on the default branch, so the PR cannot edit it; only
  comments from OWNER / MEMBER / COLLABORATOR count, and approval applies to a
  single revision (comment again after new pushes).
- Previews created by the bridge are namespaced `pr-<number>` (web paths
  `/branches/pr-<n>`, EAS update branches `pr-<n>`) and their EAS branches are
  cleaned up when the PR closes.
- Mirroring the branch into this repository remains available when a bridge
  run is not desired:
  (`git fetch origin pull/<n>/head && git push origin FETCH_HEAD:ci/pr-<n>`).
- Contributors can run the stack locally with the dev container. Mobile-only
  previews can also be label-triggered from the Expo GitHub App
  (`eas-build-<platform>:<profile>`), never from repository CI tokens.

## Changing this contract

- Required checks live in branch protection (admin). If a check name changes,
  coordinate the flip in a quiet window (`enforce_admins` is on).
- Add capabilities only to `deploy.yml`, `pr-full-run.yml` (or a new
  trusted-trigger workflow), never to `checks.yml`.
- The bridge (`pr-full-run.yml`) must keep its gate on the default branch,
  must only run for open fork PRs, and must keep preview artifacts namespaced
  by PR number.
- `require_code_owner_reviews` must stay enabled; CODEOWNERS covers
  `/.github/`, deploy tooling, `Dockerfile`, and compose files.
