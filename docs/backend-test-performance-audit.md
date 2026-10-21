# betterangels-backend — Test Suite Performance Audit

**Date:** 2026-10-21
**Scope:** `monorepo/apps/betterangels-backend` (branch `fix/be-items`, HEAD `ea7098ce`)
**Author:** DSH audit
**Status:** Findings + recommendations. No application code was changed.

---

## TL;DR

| Question | Answer |
| --- | --- |
| Is there performance headroom? | Yes. Clean serial suite is **355 s**; 4-worker pytest-xdist runs it in **146 s** (fresh DBs) / **121 s** (reused DBs), and 8 workers in **82–100 s**. |
| Should we sunset pytest to get parallel tests? | **No.** pytest + pytest-django + pytest-xdist works and passed all 2,019 tests. The thing that is actually broken is the custom `PytestTestRunner`, which makes `manage.py test --parallel` an error. |
| Does "pytest parallel" have a bug? | Not in pytest. There is a **real, reproducible flake** in the suite — exact query-count assertions depend on a warm waffle cache. At `-n 8` it failed 3 of 5 runs (`9 != 8 queries`). It is fixable in one helper/test setup. |
| Can we split function tests from DB tests? | It is possible, but it will not move total runtime: only **39 of 2,050 tests (1.9 %)** currently run without a DB, and they finish in **0.9 s**. Splitting is worth it for fast local/CI feedback, not for shaving the suite. |
| Biggest wins, in order | 1) xdist with `-n logical` capped at 4–8 (**−60 %**), 2) fix cache-order-dependent query-count tests (unlocks `-n 8`), 3) `DEBUG=False` in tests (**~12 %**), 4) per-worker cache, 5) pre-provisioned DBs (**−25 s/run**), 6) delete the fake test runner and guard `--reuse-db` staleness. |

**Expected end state:** ~355 s → **~90–120 s** in CI (≈3–4×), with a stable parallel run and no framework migration.

---

## 1. Method

All timings were taken inside the running dev container (`monorepo-better-angels-1`, 10 CPUs, 12 GB) against the same Postgres 17.11 / PostGIS service the repo uses, with the repo's real settings. pytest-xdist 3.8.0 was installed **ephemerally** into `/tmp/xdist` (not added to the project) for the experiments.

* Python 3.14, Django 6.1.2, pytest 9.1.1, pytest-django 4.12.0.
* Test settings in effect: `DEBUG=True` (from `.env`), `SESSION_ENGINE=cache` backed by Redis (`valkey`), `SESSION_SAVE_EVERY_REQUEST=True`, no `PASSWORD_HASHERS` override.
* `pyproject.toml` already sets `addopts = "--reuse-db"`.
* Collection: `2,050 tests collected in 1.55 s`.

> Measurement caveat: numbers are from a laptop dev container; CI hardware will differ. The ratios and the failure mode are what matter.

### Raw runs

| # | Command (cwd `apps/betterangels-backend`) | Result | Wall |
| --- | --- | --- | --- |
| 1 | `pytest -q` (shared `test_postgres`, `--reuse-db`) | 1,927 passed, **92 failed**, 31 skipped | 405 s (test time 401 s) |
| 2 | `POSTGRES_TEST_NAME=… pytest -q --create-db` (clean serial) | 2,019 passed, 31 skipped | **359 s** (test time 355 s) |
| 3 | `POSTGRES_TEST_NAME=… pytest -q -n 4 --create-db` | 2,019 passed | **148 s** (test time 146 s) |
| 4 | `POSTGRES_TEST_NAME=… pytest -q -n 4 --reuse-db` | 2,019 passed | **123 s** (test time 121 s) |
| 5 | `… -n 8 --reuse-db` × 5 runs | 2/5 clean; 3/5 had 1–2 failures (same test) | 82–102 s |
| 6 | `… -n 8 --reuse-db` + per-process cache × 3 runs | 3/3 clean | 96–102 s |
| 7 | `… -n 4 --reuse-db` + per-process cache + `DEBUG=False` | 1 failed (same flake) | 151 s |
| 8 | Fresh test DB + 8 tests (provisioning cost) | 8 passed | 27.3 s |
| 9 | 39 non-DB tests (no Postgres needed) | 39 passed | 0.9 s (4 s process) |
| 10 | `-n 8 --dist load --reuse-db` (per-worker timing hook) | 2,019 passed | 111 s; worker active spans 96.8–100.2 s, non-test overhead 2.3–3.2 s |
| 11 | `-n 8 --dist worksteal --reuse-db` (same DBs) | 2,019 passed | 78 s / 153 s across two runs — too noisy to call |
| 12 | 825-test subset, alternating `load` / `worksteal` at `-n 8` | 825 passed each | load 88 s / 80 s; worksteal 72 s / 79 s |

The first run's 92 failures are **not** a code regression: `test_postgres` was created by another branch and still contained `regions.0004–0006` migrations (`relation "regions_locationregion" does not exist`) while the working tree only has `regions.0001–0003`. See Finding 2.

---

## 2. Findings

### Finding 1 — pytest parallel works; the custom runner is the real bug (P0)

`betterangels_backend/runner.py` defines `PytestTestRunner` and `settings.py:533` wires it as `TEST_RUNNER`. Its `add_arguments()` registers **only** `--keepdb`:

```python
@classmethod
def add_arguments(cls, parser):
    parser.add_argument("--keepdb", action="store_true", ...)
```

Consequences, verified in the container:

```
$ python manage.py test --parallel 2 accounts.tests.test_user_manager
manage.py test: error: unrecognized arguments: --parallel ...
```

`manage.py test --help` exposes only `--keepdb`, `--noinput`, `--testrunner` — no `--parallel`, `--failfast`, `--buffer`, `--tag`. So:

* `manage.py test` is a trap: it looks like Django's runner but supports almost none of its options, and nobody can get parallel runs through it.
* pytest itself is fine. pytest-django 4.12 explicitly handles xdist worker suffixes (`pytest_django/fixtures.py:66-73` appends `_gw0`, `_gw1`, …), and the 4-worker run passed all 2,019 tests.
* The git history contains an unmerged experiment (`dc93722ae`, `668932795`, `94ffbdd6b`) that removed xdist after measuring "150 s sequential vs 450 s parallel". That measurement predates the current suite and was dominated by per-worker migrations/seeds and cache flakes — not by a pytest defect. Today the same suite measures **355 s serial vs 121–148 s with 4 workers**.

**Recommendation:** delete `betterangels_backend/runner.py` and the `TEST_RUNNER` setting, document pytest as the only entry point, and add xdist. Do **not** delete pytest.

---

### Finding 1a — Scale workers from *logical* cores, then cap them (P0)

Yes, worker count should follow the machine, but with two caveats that matter in CI:

1. **`-n auto` is physical cores, not logical.** In xdist 3.8.0, the `auto` hook calls `psutil.cpu_count(logical=False)`, while `-n logical` calls `psutil.cpu_count(logical=True)` (`xdist/plugin.py:16-32`). This suite is DB/network-bound, not CPU-bound, so **`-n logical` is the right knob** (xdist added it for exactly this case in 2.3.0). On a 4-vCPU runner with SMT, `-n auto` can pick 2 and leave half the machine unused; `-n logical` picks 4.
2. **The cap matters more than the detector.** Every worker is a full Django process that also creates its own test DB and runs migrations (~25 s first run). More workers therefore mean more DBs, more Postgres connections, more memory, and more contention — not free throughput.

Controls:

* `--maxprocesses N` caps both `auto` and `logical` (`xdist/plugin.py:89`).
* `PYTEST_XDIST_AUTO_NUM_WORKERS=N` overrides the auto-detection without editing configs (`xdist/plugin.py:17`).
* `psutil` reads the host CPU count, **not cgroup quota**. In a container limited with `--cpus`/Kubernetes limits, `-n logical` can over-provision. If CI runs under a CPU limit, pass an explicit `-n` instead of relying on detection.

Scaling measured here (10 logical cores, no SMT visible to the container):

| Workers | Full-suite wall |
| --- | --- |
| 1 (serial) | 355 s |
| 4 (reused DBs) | 121–123 s (148 s when creating all 4 DBs) |
| 8 (reused DBs) | 82–116 s (noisy; best clean 82 s) |

Doubling 4 → 8 gave roughly 1.3–1.5×, not 2× — Postgres and the CPU are shared, so this is expected. Recommend:

```bash
# CI (4-vCPU standard runner; will use 4, not 2)
PYTEST_ADDOPTS="-n logical --maxprocesses 4"

# Local, opt-in (10-core laptop -> 8 workers, not 10 DBs)
uv run pytest -n logical --maxprocesses 8

# Never bare `-n auto` in a container with a CPU quota
```

Each worker adds one test DB. Keep the cap at or below 8 until there is evidence that more workers help; at that point measure, don't guess.

---

### Finding 1b — `--dist=worksteal`: not needed here, and it has a real fixture caveat (P1/P2)

The default `--dist load` is *not* a static split: workers pull more work as they finish, so idle time at the tail is bounded by the longest remaining test. Measured with a per-worker timing hook on the full suite at `-n 8`:

* Worker active spans: **96.8 s – 100.2 s** (spread **3.4 s** across 8 workers).
* Each worker's session was only **2.3–3.2 s longer than its active test span** — i.e. DB setup, collection and teardown; no worker sat idle waiting for work after finishing its queue.
* Controller (master) waits ~4 s after the last worker for teardown.

So for this suite — 2,050 mostly uniform ~0.2 s tests — **there are no meaningfully idle workers to steal from**. Work-stealing cannot fix a tail that does not exist.

A controlled alternating run on an 825-test subset (`-n 8`, same DBs, back to back):

| Scheduling | Run 1 | Run 2 |
| --- | --- | --- |
| `--dist load` | 88 s | 80 s |
| `--dist worksteal` | 72 s | 79 s |

Worksteal was ~5–10 % better at best, inside the run-to-run noise (full-suite runs varied 78–153 s for the same config). Not a reason to change the default.

On the "was worksteal fixed?" question, the version history matters:

* **3.2.1** fixed a worksteal hang (`#884`).
* **3.7.0** made the internal `steal` command atomic (`#1144`), removing partial-steal races.
* Running **3.8.0**, both of those are fixed.
* But the fixture behaviour is **by design, not a bug**: issue `#1391` (Oct 2026) showed that when a worker has already torn down a high-scope (session/class) fixture after its last scheduled test, a stolen test can cause that fixture to be created again on the same worker. The maintainer closed it as "expected... because it was torn down after the last scheduled test" — i.e. **won't fix**. That matters directly if you adopt `setUpTestData` (Phase 1): worksteal can split one class's tests across workers and re-run its class fixture more than once. Functional results stay correct, but setup cost goes up.
* `-x`/`--maxfail` is also weaker under xdist because already-dispatched tests keep running; `#1034` is still open. Don't rely on fail-fast in parallel CI.

**Recommendation:** keep `--dist load` for now. Revisit `worksteal` only if a future profile shows a long tail (a handful of very slow tests). If/when `setUpTestData` lands, switch to `--dist loadfile` (group by file) rather than worksteal, so class fixtures stay on one worker.

---

### Finding 2 — `--reuse-db` by default silently reuses a stale schema (P1, correctness)

Because `--reuse-db` is in `addopts` and every checkout shares `test_postgres`, switching branches or pulling migrations leaves the DB behind the working tree. The first run of this audit produced **92 phantom failures** from a `regions` schema that no longer exists on this branch.

The repo already documents `POSTGRES_TEST_NAME` for worktrees (`docs/backend_readme.md`), but not the migration-drift case.

**Recommendation (pick one):**

1. Make the test DB name include a schema fingerprint, e.g. `POSTGRES_TEST_NAME=test_postgres_$(git rev-parse --short HEAD)` (or a hash of the migration file list) in a wrapper script; or
2. Add a small conftest check that compares `django_migrations` on disk vs applied and fails with *"run with --create-db"* instead of producing 92 unrelated failures; or
3. In CI, always use a fresh container DB (already true), and locally document `uv run pytest --create-db` after pulling migrations.

Also worth a note in `docs/backend_readme.md` next to the existing worktree warning.

---

### Finding 3 — 159 exact query-count assertions are the parallel flake (P0 for `-n 8`)

The suite has **163 `assertNumQueries` assertions in 23 files**, of which **159 go through `assertNumQueriesWithoutCache`** and only **1** uses `assertMaxNumQueries`. These are the fragile surface.

Reproduced failure at `-n 8`/`-n 4`:

```
AssertionError: 9 != 8 : 9 queries executed, 8 expected
shelters/tests/test_shelter_photo_mutations.py::ResolveShelterPhotoUploadsMutationTest::test_creates_single_shelter_photo_and_returns_it
```

Deterministic reproduction in a single process:

```bash
# fails
pytest common/tests/test_images.py \
  "shelters/tests/test_shelter_photo_mutations.py::ResolveShelterPhotoUploadsMutationTest::test_creates_single_shelter_photo_and_returns_it"
# → 1 failed, 7 passed  (9 != 8)

# passes
pytest -p ba_warm_plugin common/tests/test_images.py <same test>
# → 8 passed
```

Mechanism:

1. `is_imgproxy_enabled()` (`common/imgproxy.py`) calls `waffle.switch_is_active(IMGPROXY_SWITCH)`; waffle caches the switch in Django's cache (Redis in this environment).
2. The switch is primed at `post_migrate` by `common/signals.enable_imgproxy_switch` — i.e. once, when the test DB was created, in whichever process created it (or globally in Redis).
3. `common/tests/test_images.py` uses `override_switch`, which **invalidates the switch cache** on exit. The next test that asserts an exact query count then pays one extra `SELECT` for the switch → `9 != 8`.
4. Under xdist, whether a worker has a warm switch before that test is scheduling-dependent, hence intermittent: 3 of 5 `-n 8` runs failed, always the same assertion. The two plain `-n 4` runs passed, but the `-n 4` run with the alternate cache backend hit it once; serial passes because a warming test always runs first.

**Recommendation (small, high value):**

* Warm the switch before capturing queries. The cleanest single change is inside the shared helper:

  ```python
  def assertNumQueriesWithoutCache(self, query_count):
      ContentType.objects.clear_cache()
      Site.objects.clear_cache()
      # Warm waffle's switch cache outside the captured block. Without this,
      # the first switch lookup in a process adds one query and the expected
      # count depends on test order (flaky under xdist).
      waffle.switch_is_active(IMGPROXY_SWITCH)
      return self.assertNumQueries(query_count)
  ```

  This covers all 159 uses at once. Alternatively (or additionally) warm in the `setUp` of the affected classes, like `test_shelter_photo_mutations.py:258` already does for a sibling test.

* Consider switching exact `assertNumQueries` to `assertMaxNumQueries` where the exact count is not the point (only 1 such use today). This removes an entire class of order/cache coupling.

* With the warm fix, `-n 8` was clean 3/3 in our runs (96–102 s) versus 2/5 clean without it.

This is the concrete answer to "the pytest parallel runner has a bug": the framework is sound; the suite makes an order-dependent assumption that only shows up when tests are reordered across workers.

---

### Finding 4 — `DEBUG=True` in tests costs ~12 % (P1)

Tests run with `DEBUG=True` (verified with `django.setup()`: `DEBUG=True`, from `.env`, also in the container/CI path via `IS_LOCAL_DEV=True` → `.env`). Django then wraps every cursor in `CursorDebugWrapper` and accumulates `connection.queries`.

Measured on the same 201-test subset (`notes/tests teams/tests`):

| Setting | Test time | Wall |
| --- | --- | --- |
| `DEBUG=True` (default) | 34.55 s | 38 s |
| `DEBUG=False` | 30.48 s | 33 s |

That is **~12 %** for a one-line test-settings override, with no behavioral failures observed (the only tests that touch `DEBUG` patch it to `False` themselves; the removed URL is the `MEDIA_URL` static route, not used by tests).

**Recommendation:** create `betterangels_backend/settings_test.py` that imports the base settings and sets `DEBUG = False`, then point `DJANGO_SETTINGS_MODULE`/`--ds` at it for tests. Do a full run to confirm before landing.

---

### Finding 5 — DB provisioning is per worker, not cloned (P2)

pytest-django creates one DB per xdist worker and runs the full migration chain + `post_migrate` seeds in each. Django's own `--parallel` runner instead creates one DB and **clones** it per worker (`CREATE DATABASE ... TEMPLATE`), which is why the Django runner's startup is cheaper.

Measured here:

* Fresh DB + 8 tests, serial: **27.3 s** (≈25 s provisioning).
* Same, `-n 2` with `--create-db`: **38 s** (two DBs created concurrently).
* `-n 4 --create-db` full suite vs `-n 4 --reuse-db` full suite: **148 s vs 123 s** → provisioning costs ~25 s (≈17 % of the parallel run).

None of this is a pytest bug, and it is small relative to the 2.4–2.9× win. If it matters later:

1. In CI, pre-create one migrated DB, then clone it to the worker names:
   `createdb -T test_postgres test_postgres_gw0 … test_postgres_gw3`, then run with `--reuse-db`; or
2. add a `scripts/prepare_test_dbs.sh` that does the above and is called before `pytest -n 4`.

Do **not** use `--no-migrations`: this project has `pgtrigger`/`pghistory` trigger migrations (`accounts/migrations/0008_*` uses `pgtrigger.migrations.AddTrigger`), so syncdb-style schema creation would miss triggers and break history tests.

---

### Finding 6 — Shared Redis cache ties workers together (P1 for parallel safety)

`CACHES` points at Redis and `SESSION_ENGINE = "django.contrib.sessions.backends.cache"`, so all xdist workers share one cache. For tests that mutate waffle switches/flags this creates cross-worker interference (Finding 3) and was already called out in the unmerged commit `94ffbdd6b` ("eliminate flaky query-count assertion failures across parallel workers").

Measured: on a 201-test subset, switching to `LocMemCache` + signed-cookie sessions + MD5 hasher + `DEBUG=False` gave **31.2 s vs 34.6 s** — i.e. the cache/session/hasher part alone is roughly noise; the isolation value is for correctness, not speed.

Important caveat: per-process cache **alone does not fix** Finding 3. A `-n 4` run with `LocMemCache` still hit the `9 != 8` flake once, because the switch was cold inside that worker. You need both:

1. per-process cache (removes cross-worker invalidation), and
2. deterministic warming of the switch for query-count tests.

The suite already has a test that asserts a cache-session key is deleted (`accounts/tests/test_logout_case.py:34`), so keep `SESSION_ENGINE=cache`; just swap the cache backend to `LocMemCache` in test settings. `common/tests/test_single_instance.py` already does this locally with `@override_settings`, which is good evidence it is safe.

---

### Finding 7 — "DB vs function" split is not a runtime lever today (P2)

Inventory (AST over `apps/betterangels-backend`):

| Category | Classes | Declared tests |
| --- | --- | --- |
| `GraphQLBaseTestCase` subtree (DB + HTTP) | 127 | 661 |
| Plain `TestCase` subtree (DB) | 155 | 831 |
| `SimpleTestCase` subtree (no DB) | 8 | 30 |
| **Total declared** | **322** | **1,662** (2,050 collected after parametrization) |

Only **5 files / 39 tests** run without a DB, in **0.92 s**. The DB session setup is a one-time ~25 s and the pure tests are ~2 % of the count. Separating them therefore saves essentially nothing on a full run.

What *is* worth doing:

* Add a `unit` marker (or a `test:unit` Nx target) for the 39 non-DB tests so pre-commit/local feedback can run in ~1 s without Postgres.
* More useful than a DB/non-DB split: **shard the DB suite across workers/jobs**. That is exactly what `-n 4` buys (Finding 1); if CI needs to go below ~2 min, `pytest-split --splits N --group K` on a CI matrix is the next step (each job provisions its own DB).
* Structural (long-term): test services directly with `SimpleTestCase` where the GraphQL schema is not the contract. Today many pure helpers are tested through `TestCase` (e.g. `shelters/tests/test_service_utils.py`'s `ParseLocationTestCase`, `SetM2mFromEnumsTestCase`). Those still open a transaction and use DB fixtures they don't need. Moving them down a layer removes HTTP/middleware/session cost and makes the suite cheaper per test — but it is a refactor, not a config change.
* Do **not** try to split transactional vs non-transactional: only one test uses `transaction=True` (`accounts/tests/test_services.py:123`). The 1.55 s teardown on that test is the only outlier.

---

### Finding 8 — Fixture setup is smaller than it looks (P2, contrary to expectation)

`setUp` is used 231 times and `setUpTestData` only 3 times, so it is tempting to convert everything. Measured phase split with `--durations=0`:

| Class | Tests | setup | call | total |
| --- | --- | --- | --- | --- |
| `shelters/tests/test_shelter_filters.py` | 59 | 1.4 s | 23.1 s | 24.6 s |
| `notes/tests/test_mutations.py` + `accounts/tests/test_admin.py` | 112 | 1.1 s | 29.9 s | 31.1 s |

Fixture setup is **~4–6 %** of runtime. `GraphQLBaseTestCase.setUp()` creates 4 users, 2 orgs, 3 teams, roles/grants per test, but that costs tens of milliseconds, not hundreds. Converting the base class to `setUpTestData` could save single-digit percent, with real correctness risk (shared objects mutated by tests).

**Recommendation:** skip this as a first pass. If done later, start with read-only base fixtures (`GraphQLBaseTestCase` users/orgs) and keep a per-test `Client`/login; verify with `--failfast` and a shuffled order (`pytest-randomly` or `-p no:randomly`).

---

### Finding 9 — Smaller items, with evidence

| Item | Evidence | Recommendation |
| --- | --- | --- |
| **Password hashing** | Only 13 `set_password` + 28 `create_user` call sites; most users are `baker.make(User)` with unusable passwords | Add `MD5PasswordHasher` to test settings anyway (free), but don't expect a measurable win |
| **Postgres durability** | `fsync=off`, `full_page_writes=off`, `wal_level=minimal` already set; `synchronous_commit` is **on** | Add `-c synchronous_commit=off` to the `db` command in `docker-compose.yml` (single-digit % on migrations/commits, zero risk for test data) |
| **pghistory/pgtrigger** | 37 tracked models → every insert/update also writes an event row via DB trigger | Only 3 test files assert events (`accounts/tests/test_user_events.py`, `shelters/tests/test_models.py`). A test-only `ALTER TABLE … DISABLE TRIGGER USER` (re-enabled for those classes) is a possible later experiment; measure before adopting |
| **New Relic hooks** | `common/tests/test_queries.py::NewRelicGraphQLSmokeTestCase` initializes the agent; tracebacks from later `regions` tests show `newrelic/hooks/database_psycopg.py` wrapping `cursor.execute`, and `shutdown_agent()` does not unhook | Run that smoke test in an isolated process (or accept the ~µs/query overhead); it is also a global-state isolation smell |
| **New Relic + structlog logging** | `django_structlog` RequestMiddleware logs every request at INFO | Set those loggers to WARNING in test settings; small but free |
| **Stale test DBs** | **433** `test_*` databases, **12 GB** total, 27–42 MB each; `--reuse-db` never drops them | Add a cleanup script (`dropdb` for all `test_*` except the current one) and document it; this does not affect runtime but is real disk/maintenance debt |
| **Nx target outputs** | `project.json` declares `outputs` for `reports/apps/.../unittests` and `coverage/...`, but the command is plain `uv run pytest` and neither pytest-cov nor JUnit is configured | Either add `--junitxml=…`/`--cov` (coverage slows tests ~20–30 %, don't enable by default) or remove the outputs. Add `--durations=25` and a JUnit artifact to CI for trend visibility |
| **Collection warnings** | `TestDirective` in `common/graphql/tests/test_decorators.py` cannot be collected as a test | Rename to `_TestDirective`/`DirectiveCase` to keep collection clean |

---

## 3. Recommended plan

### Phase 0 — land the win (≈1 day)

1. Add `pytest-xdist` to the root `dev` dependency group.
2. Fix the query-count flake at the source: warm the imgproxy switch in `assertNumQueriesWithoutCache` (or in the affected `setUp`s). Verify with the deterministic repro above.
3. Run the backend test target in CI with 4 workers, e.g.:

   ```yaml
   # .github/workflows/default.yml, Test step
   env:
     PYTEST_ADDOPTS: "-n logical --maxprocesses 4"
   ```

   `logical` (not `auto`): `auto` counts physical cores, and on an SMT runner that under-provisions. The cap keeps each worker's test DB and Postgres connection bounded. Local default stays serial (so `uv run pytest` doesn't create 8–10 DBs on a laptop); opt in with `pytest -n logical --maxprocesses 8`.
4. Delete `betterangels_backend/runner.py` and `TEST_RUNNER` from settings; update `docs/backend_readme.md` to say pytest is the test entry point (and that `manage.py test` is not supported).
5. Clean up `test_audit_*`/stale DBs; add a short note about `--create-db` after pulling migrations.

**Acceptance:** CI backend test step ≤ 2:30, 0 flakes in 10 consecutive runs at `-n 4`. Expected: 355 s → ~125–150 s.

### Phase 1 — make it fast and boring (1–2 days)

1. Add `betterangels_backend/settings_test.py` with:
   * `DEBUG = False`
   * `CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}` (keep `SESSION_ENGINE=cache`)
   * `PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]`
   * quieter `django_structlog`/`structlog` logging
   * optionally `POST_OFFICE = {**POST_OFFICE, "CELERY_ENABLED": False}` — **validate first**, some tests assert queued-email behavior
2. Point `DJANGO_SETTINGS_MODULE` at it for test runs.
3. Re-run the full suite serial and at `-n 4`/`-n 8`, then burn in 10 runs at `-n 8` to catch remaining order dependence.
4. Tune worker count to the CI runner: `-n logical --maxprocesses 4` on a GitHub-hosted 4-vCPU runner, `-n logical --maxprocesses 8` on the 10-core dev box. `-n auto` is physical-core detection and can under-provision on SMT runners.
5. If `setUpTestData` is added, switch Distribution to `--dist loadfile` so a class's tests stay on one worker (and do **not** use `worksteal` for that — see Finding 1b).

**Expected:** ~90–110 s at `-n 8`, or ~110–125 s at `-n 4`, with `DEBUG=False` shaving another ~10 %.

### Phase 2 — optional hardening

* Pre-provision/clone worker DBs (saves ~25 s/run).
* `unit` marker + `test:unit` Nx target (no Postgres, ~1 s).
* `pytest-split` + CI matrix if wall time must go below ~2 min.
* Evaluate disabling pgtrigger triggers in tests (measure first).
* Isolate the New Relic smoke test in a subprocess.
* `synchronous_commit=off`; DB cleanup script; JUnit/durations in CI.

---

## 4. Direct answers to the questions asked

**"Should we sunset pytest to be able to run parallel tests?"**
No. pytest-django + pytest-xdist is the supported parallel path, it works here (2,019 passed at `-n 4`), and it is 2.4–2.9× faster than serial. The only pytest-related item that is genuinely broken is the project's custom `PytestTestRunner`, which registers only `--keepdb` and therefore makes `manage.py test --parallel` an error. Delete the runner, not pytest. Switching to Django's runner to get `--parallel` would trade away pytest fixtures/parametrization/VCR wiring/`-k`/`--durations`/xdist and require converting 322 test classes and the pytest-style tests, to recover a ~25 s DB-provisioning advantage.

**"Is there a bug in parallel pytest?"**
Not in pytest. There is a real flake in the suite: 159 exact query-count assertions assume a warm waffle switch cache. It reproduces deterministically when `common/tests/test_images.py` (which uses `override_switch`) runs before the shelter-photo test, and intermittently under xdist (3/5 runs at `-n 8`). Fix = warm the switch outside the captured query block (and/or use max-query assertions); per-worker cache is complementary, not sufficient.

**"Can we separate function tests from DB tests?"**
Yes, but it changes almost nothing on total runtime: 39 non-DB tests / 1.9 % / 0.9 s. Do it for fast feedback (a `unit` target that runs without Postgres), not for suite time. The split that actually pays is sharding DB tests across workers/jobs.

**"Should worker count scale with cores, locally and in CI?"**
Yes, but use `-n logical` rather than `-n auto`, and cap it. `auto` is physical-core detection in xdist 3.8 (`psutil.cpu_count(logical=False)`); this suite is DB-bound, so logical CPUs are the right ceiling. `--maxprocesses N` / `PYTEST_XDIST_AUTO_NUM_WORKERS=N` let CI and local differ without editing config. Each worker creates its own test DB and runs migrations (~25 s first run) and holds its own connections/memory, so 4 on a 4-vCPU CI runner and 8 on a 10-core laptop is the practical range; 8 was only ~1.3–1.5× faster than 4, not 2×. Note `psutil` does not see cgroup CPU quotas — pass an explicit `-n` if CI limits CPUs.

**"Is the xdist issue worksteal, and were workers idling / was it fixed?"**
No meaningful idling here, and worksteal is not a fix for a problem this suite has. Default `--dist load` already balances by completion: at `-n 8` on the full suite, worker active spans were 96.8–100.2 s (3.4 s spread) with a post-test idle tail of ≤ 0.03 s. On an 825-test alternating control, worksteal was 72/79 s versus load 88/80 s — inside the noise. Worksteal's scheduler bugs are fixed in current 3.8 (hang: 3.2.1 `#884`; atomic steal: 3.7.0 `#1144`), but re-running high-scope fixtures after a steal is **expected behaviour, closed won't-fix** (`#1391`), and `-x` is still unreliable under xdist (`#1034`). Keep `load`; use `loadfile` if class-scoped fixtures are introduced; don't use worksteal just to chase tail idle that isn't there.

---

## 5. What was not verified

* CI runner hardware and the exact CI wall time (only the container here). Expect the same ratios but a smaller absolute gain on fewer CPUs.
* Coverage runs (not enabled; `pytest-cov` is not installed) and their overhead.
* `--no-migrations`: almost certainly unsafe because of `pgtrigger` trigger migrations; not tested.
* The size of the pghistory trigger overhead (not benchmarked; listed as a later experiment).
* Whether `POST_OFFICE["CELERY_ENABLED"] = False` is safe for all email tests (needs a full run).
* `--dist loadfile` timing (only `load` and `worksteal` were measured; `load` balanced well).
* Worker memory per process and the exact cgroup-aware worker cap for the CI runner.

---

## 6. References

* pytest-django FAQ — xdist support: <https://pytest-django.readthedocs.io/en/stable/faq.html#does-pytest-django-work-with-the-pytest-xdist-plugin>
* Django advanced testing — parallelization (`--parallel`, DB cloning): <https://docs.djangoproject.com/en/stable/topics/testing/advanced/#parallelization>
* pytest-xdist changelog (3.2.1 worksteal hang `#884`, 3.7.0 atomic steal `#1144`, 3.8.0): <https://github.com/pytest-dev/pytest-xdist/blob/master/CHANGELOG.rst>
* pytest-xdist `--dist=worksteal` fixture re-execution (closed as expected behaviour): <https://github.com/pytest-dev/pytest-xdist/issues/1391>
* pytest-xdist `--exitfirst` limitation: <https://github.com/pytest-dev/pytest-xdist/issues/1034>
* Local source of truth: `pytest_django/fixtures.py:66-73` (xdist DB suffix), `:162-203` (`django_db_setup`, `keepdb`), `xdist/plugin.py:16-32` (`auto` = physical, `logical` = logical, env override), `betterangels_backend/settings.py` (test settings now live in `settings_test.py`).
* Prior, unmerged experiments on branches: `5624ecfdc` (14 min → 66 s with xdist), `94ffbdd6b` (PG tuning + waffle cache), `dc93722ae` + `668932795` (remove xdist). None are ancestors of `HEAD` except the migration squash `a8c6bfb07`.

---

## 7. Implementation status (2026-10-21)

Landed in the working tree (no commit):

1. `pytest-xdist` added to the root and backend `dev` groups; `uv.lock` updated
   (adds `pytest-xdist 3.8.0` and `execnet`).
2. `betterangels_backend/settings_test.py` added and selected by both
   `pyproject.toml` files:
   * `DEBUG = False`;
   * per-process `KEY_PREFIX` on the shared Redis cache (workers no longer
     invalidate each other's waffle/session keys).  A local-memory cache was
     tried first but breaks `time_machine` tests: LocMem TTLs use patched
     `time.time()`, so sessions expire 91 days into a test.  Redis TTLs are
     server-side and unaffected;
   * `MD5PasswordHasher`.
3. `NumQueriesWithoutCacheMixin` now warms the `imgproxy_enabled` waffle switch
   outside the captured block, fixing the deterministic repro
   (`test_images.py` → shelter-photo test) and the xdist flake.
4. `betterangels_backend/runner.py` deleted and `TEST_RUNNER` removed;
   `manage.py test` no longer pretends to be a test entry point.
5. CI test step exports
   `PYTEST_ADDOPTS="-n logical --maxprocesses 4 --durations=25"`.
6. `docs/backend_readme.md` and `docs/tooling.md` updated (parallel commands,
   test settings, stale `--reuse-db` guidance).

Validation on the implementation (reused `test_impl` DBs):

| Run | Result | Wall |
| --- | --- | --- |
| serial, `settings_test` | 2,019 passed, 31 skipped | **333 s** (test 329 s) |
| parallel, first run (creates 4 worker DBs) | 2,019 passed | **174 s** (test 171 s) |
| parallel, reused DBs, run 1 | 2,019 passed | **134 s** (test 131 s) |
| parallel, reused DBs, run 2 | 2,019 passed | **125 s** (test 123 s) |

Two consecutive parallel runs were clean, including the previously flaky
`ResolveShelterPhotoUploadsMutationTest` and the `time_machine` clients tests.

Deferred to Phase 2: DB-clone pre-provisioning, `unit` marker/target,
pghistory trigger experiment, New Relic isolation, JUnit/coverage artifacts,
stale-test-DB cleanup script, and `synchronous_commit=off`.

