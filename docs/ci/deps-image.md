# Content-addressed deps image

Status: design proposal. This PR adds no production code.

## Problem

The production image is rebuilt from the Dockerfile on every `main` push. It
builds `uv-stage` (`uv sync`), `yarn` (`yarn install`), and then the final
`production` stage, and it exports a `mode=max` registry cache. On the current
runner that is about 6.1 minutes per merge, and the image step is the last
serial block before deploy (main end-to-end is about 14 minutes).

Most of that work is identical across commits. Only a lockfile or Dockerfile
change should force the dependency stages to run again.

## Proposal

Publish the dependency stages as their own image, tagged by a hash of their
inputs:

```
monorepo:deps-<hash>
```

The production stage starts from that image and only adds the checkout:

```dockerfile
FROM base AS deps
COPY --from=uv-stage --link /workspace /workspace
COPY --from=yarn --link /workspace /workspace

ARG DEPS_IMAGE=monorepo:deps-local
FROM ${DEPS_IMAGE} AS production
COPY --chown=betterangels . /workspace
```

`DEPS_IMAGE` is a global build arg, declared before the `FROM` that consumes it, so
a local build can point it at a locally built tag.

Hash inputs:

- `tools/monorepo-image/Dockerfile`
- `uv.lock`, `pyproject.toml`, `apps/betterangels-backend/pyproject.toml`
- `yarn.lock`, `package.json`, `apps/*/package.json`, `.yarnrc.yml`
- the base image digest

CI flow on `main`:

1. Compute the hash.
2. Check whether `monorepo:deps-<hash>` exists with `docker buildx imagetools inspect`.
3. If it is missing, build and push it once:
   `docker buildx build --target deps --push -t monorepo:deps-<hash> ...`
4. Build and push the production image with
   `--build-arg DEPS_IMAGE=monorepo:deps-<hash>`.

If the deps image is missing and its build or push fails, fall back to the current
`production` target so a merge is never blocked by the deps image.

The production build no longer needs a `mode=max` cache export: its expensive
inputs are an image it can pull. The deps image build itself can still use
`cache-from` and export once per lockfile change. The `ci-base` image stays
toolchain-only, and the `development` stage is unchanged.

## Expected impact

| Case | Image step | Main run |
|---|---|---|
| Source-only merge | ~1.5-2.5 min | ~7.4-8.4 min |
| Lockfile merge | ~5-5.5 min (deps build + production) | ~9.5-10 min |

- Runner minutes per main push: about 20.9 -> 13.6-14.6 on a source-only merge.
- The 1.9 minute registry cache export disappears.
- This **reduces** the value of the overlap (#2613) rather than removing it: with a
  ~1.5-2.5 minute image the overlap still hides the image behind the test stage,
  but its ceiling drops from 3.2 to ~1.5-2.5 minutes. It does remove the need for
  the conditional cache export (#2614).

On a lockfile-changing merge (dependabot, common on `main`), the deps image build
adds about 3-4 minutes, but it replaces work the current build already does and
can overlap with the test run.

## Costs and risks

- Dockerfile restructure and a new Nx container target (`publish-deps`), plus a
  build arg on the production target.
- ECR lifecycle: deps tags must not expire like feature-branch tags; they are
  content-addressed and reusable.
- Local development: `yarn nx run monorepo-image:image:production` must either
  build a local deps image first or pull the CI one. Default the build arg to a
  local tag and document the target.
- Base image updates: the hash must include the base digest, or the deps image
  must be rebuilt on a schedule; otherwise a base image change is silently
  ignored.
- Cache correctness: a stale deps image paired with a new lockfile is the one
  bad failure mode. The hash must cover every input the stages read.

## Validation plan

1. Build the `deps` and `production` targets locally; run the backend and both
   web builds from the resulting image.
2. Compare the image contents (`uv pip list`, `node_modules` presence) with the
   current production image.
3. On a test branch, force a deps rebuild and confirm the tag is reused on the
   next run.
4. On `main`, watch one lockfile merge and one source-only merge; compare the
   image step and the deploy digest.
5. Keep the current `production` stage as `production-legacy` until one week of
   runs is clean.

## Effort

About 1-2 days, including the ECR lifecycle change and the local-dev path.

## Open questions

- Should the deps image be per-architecture or amd64-only like the production
  image today?
- Does ECR support a lifecycle rule that keeps `deps-*` while expiring branch
  tags?
- Is the `COPY --from` layer reuse enough, or does the deps image need to be the
  direct parent of `production` to avoid re-copying the whole `/workspace`?

## Decision

If this is funded, park #2614 and simplify #2613; do not maintain two image
strategies in parallel. If it is not funded, #2614 is the smaller stopgap.
