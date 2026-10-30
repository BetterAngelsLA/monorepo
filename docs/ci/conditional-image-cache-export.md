# Conditional registry cache export

Status: design proposal. This PR adds no production code.

## Problem

The production image publish on `main` takes about 6.1 minutes. Roughly 114 seconds
of that is `exporting cache to registry` for the `mode=max` registry cache
(`tools/monorepo-image/project.json`). The Docker build context is about 31 MB, so
the repository `COPY` layer alone is unlikely to account for that; the cost is more
likely the dependency stages (`uv-stage`, `yarn`) or registry bookkeeping. Measure
before relying on either explanation.

## Proposal

Add a second publish target, `publish-fast`, that keeps `cache-from` but omits
`cache-to`. The workflow picks it when the dependency inputs have not changed, and
uses the existing `publish` target when they have.

```
tools/monorepo-image/project.json
  publish       -> cache-from + cache-to (mode=max)   # today
  publish-fast  -> cache-from only                    # new
```

The selection is made in the workflow before the image build starts, and passed
to the container that runs it:

- `publish` when any dependency input changed since `NX_BASE`
- `publish-fast` otherwise

Dependency inputs, not the whole repository:

- `tools/monorepo-image/Dockerfile`
- `uv.lock`, `pyproject.toml`, `apps/betterangels-backend/pyproject.toml`
- `yarn.lock`, `package.json`, `apps/*/package.json`, `.yarnrc.yml`
- the base image digest (`python:3.14.8-trixie` is a mutable tag)

App source, `docs/`, and `.github/` must not select the slow path: they change the
final `COPY` layer but not the dependency stages, and the final layer is the part
we do not need in the cache.

## Why not `mode=min`

`mode=min` would still export the final image's layers, but the intermediate
`uv-stage` and `yarn` layers are what make the next build fast. Dropping them
turns a 114 second export into a 2-3 minute `uv sync`/`yarn install` on the next
run. The conditional export keeps `mode=max` but runs it less often.

## Failure modes to design against

1. **Mutable base tag.** An upstream `python:3.14.8-trixie` update changes the
   build without any git diff. Without the digest in the condition, the fast path
   keeps running and every build re-does the dependency layers. Include
   `docker buildx imagetools inspect` output, or export on a schedule.
2. **Detection gaps.** `pyproject.toml` or `package.json` can change without a
   lockfile. Missing them means the cache never refreshes and every build pays
   the rebuild.
3. **Target drift.** Two nearly identical Nx targets can diverge. Keep the
   shared options in one place (a preset or a generated config), or add a test
   that compares them.
4. **ECR lifecycle.** A buildcache tag that disappears forces a cold rebuild;
   confirm the lifecycle policy keeps the main cache ref.

## Expected impact

Up to 1.9 minutes per main run, with or without the overlap (#2613): the image
step is on the critical path either way. PR runs build no image, so the PR effect
is zero. The saving is the export step itself; if the cache
goes stale, the next builds repay it.

## Relationship to the deps image

`docs/ci/deps-image.md` proposes removing the dependency stages from the production
build entirely. If that work is funded, park this: with a ~1.5-2.5 minute image
there is much less cache export to skip, and maintaining two image strategies is
not worth it. This design is the stopgap if the deps image is not funded.

## Validation plan

1. Measure first: parse the build log and determine whether the 114 second export
   is uploading dependency layers that already exist in the registry. If it is
   mostly registry bookkeeping, the skip is a pure win; if it is new blobs, find
   out why before relying on it.
2. Source-only merge: expect `publish-fast` and an image step near 4.3 minutes.
3. Lockfile merge: expect `publish`, and a cache write.
4. Next source-only merge: expect cache hits and no dependency rebuild.
5. Watch three consecutive main runs; revert if the image step exceeds 6 minutes.

## Rollout

Select the target through a temporary `CACHE_EXPORT=auto|always` environment
variable, defaulting to `auto` on `main`. Revert is a single commit that restores
`cache-to` on the one target.

If the deps image proceeds, park this PR rather than merging both.

## Open questions

- Is the export cost the dependency layers or the final `COPY` layer?
- Does ECR deduplicate blobs across the `buildcache-main` and image tags?
- Should the fast path ever be used on PRs once they build images again?
