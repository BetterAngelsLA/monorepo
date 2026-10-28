# Developer task runner.  Run `make` to list the commands.
#
# Works from the host and from inside the dev container:
#   inside the container -> commands run directly
#   on the host          -> commands run in the running dev container (docker
#                           exec), so the same command works from either side
#
# Targets that cannot work inside the container are tagged [host] and guarded
# by `require-host`; everything else is [anywhere].
#
# Adding a target: its own `.PHONY:` line directly above it, and a
# `## [tag] one-line description` marker on the target line. `make help` is
# generated from those markers, so it needs no editing as targets are added.
#
# File layout: COMMANDS (what a user types, listed by `make help`) first, then
# INFRASTRUCTURE (plumbing: guards and the catch-all rule, never typed).
#
# Arguments: `make test <arg>` receives <arg> as a make GOAL, which the recipe
# reads back from MAKECMDGOALS — that is how a positional argument reaches the
# runner without the `VAR=value` ceremony. Extra runner flags go in ARGS:
#   make test pw ARGS='-g "results pane"'

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

# Derived from this Makefile's own directory: the repo path differs between host
# and container, so a constant would only work on one side.
REPO_ROOT := $(patsubst %/,%,$(dir $(realpath $(firstword $(MAKEFILE_LIST)))))

# Service name from docker-compose.yml / .devcontainer/devcontainer.json.
SERVICE ?= better-angels
COMPOSE_FILE := $(REPO_ROOT)/docker-compose.yml
CONTAINER_ROOT ?= /workspace

IN_CONTAINER := $(wildcard /.dockerenv)

ifeq ($(IN_CONTAINER),)
  # --- on the HOST: run the work in the already-running dev container. The
  #     container is found by compose service label, so the compose project
  #     name does not matter. Override with CONTAINER=<name> if needed. ---
  CONTAINER ?= $(shell docker ps --filter label=com.docker.compose.service=$(SERVICE) \
  	--format '{{.Names}}' 2>/dev/null | head -n1)
  RUN := docker exec -i $(CONTAINER)
  DEV := $(CONTAINER_ROOT)/tools/dev
  WHERE := the '$(SERVICE)' dev container (docker exec $(if $(CONTAINER),$(CONTAINER),<not running>))
else
  # --- inside the dev container: run directly ---
  RUN :=
  DEV := $(REPO_ROOT)/tools/dev
  WHERE := this container ($(REPO_ROOT))
endif

TEST_ARG := $(word 2,$(MAKECMDGOALS))

# Anything after the target is passed to the runner, so devs can type
# `make test maestro android` instead of the VAR=value form.
TEST_EXTRA := $(wordlist 3,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))

# A host-absolute path (e.g. /Users/me/monorepo/apps/x.spec.ts) does not exist
# inside the container; rewrite the repo prefix. Identity when already there.
TEST_ARG_RESOLVED := $(patsubst $(REPO_ROOT)/%,$(CONTAINER_ROOT)/%,$(TEST_ARG))

# Maestro drives a simulator/emulator, which only exists on the host: this
# keyword is never forwarded into the container.
HOST_KEYWORDS := maestro
ifneq ($(filter $(HOST_KEYWORDS),$(TEST_ARG)),)
  TEST_RUN :=
  TEST_DEV := $(REPO_ROOT)/tools/dev
else
  TEST_RUN := $(RUN)
  TEST_DEV := $(DEV)
endif

# ===========================================================================
# COMMANDS  —  what a user types. Everything here carries a `## ` marker, so
# `make help` lists it.
# ===========================================================================

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help: ## [anywhere] Show this help
	@echo ""
	@echo "  Runs in: $(WHERE)"
	@echo ""
	@grep -hE '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ---------------------------------------------------------------------------
# Tests  —  [anywhere] one runner, addressed as all | be | fe | pw |
# <project> | <file>; `make test` alone prints that runner's usage
# ---------------------------------------------------------------------------

.PHONY: test
test: $(if $(filter $(HOST_KEYWORDS),$(TEST_ARG)),,require-container) ## [anywhere] Run tests — `make test all|be|fe|pw|maestro|<project>|<file>`, bare for usage
	@$(TEST_RUN) bash $(TEST_DEV)/test.sh $(TEST_ARG_RESOLVED) $(TEST_EXTRA) $(ARGS)

# ===========================================================================
# INFRASTRUCTURE  —  plumbing, NOT commands. Deliberately without `## ` markers
# so it never appears in `make help`. Nothing below here is meant to be typed
# by hand; targets above depend on it.
# ===========================================================================

# Guard, [host]-only: refuses to run inside the container. Depend on this from
# any target that manages Docker, git outside the repo, or volumes.
.PHONY: require-host
require-host:
	@test -z "$(IN_CONTAINER)" || { \
		echo "This is a [host] target — run it from the HOST, not inside the container."; \
		exit 1; }

# Guard, [anywhere]: from the host a running dev container must exist, since
# that is where the work happens. A no-op inside the container.
.PHONY: require-container
require-container:
ifeq ($(IN_CONTAINER),)
	@test -n "$(CONTAINER)" || { \
		echo "No running '$(SERVICE)' dev container found."; \
		echo "Start it from VS Code (Dev Containers: Reopen in Container), then retry."; \
		exit 1; }
endif

# `make test <arg> <more args>` hands make extra goals. Swallow the target and
# the args that follow it; anything else is a typo worth reporting.
%:
	@if [[ "$@" != "$(TEST_ARG)" ]] && [[ " $(TEST_EXTRA) " != *" $@ "* ]]; then echo "make: unknown target '$@' (see 'make help')" >&2; exit 2; fi
