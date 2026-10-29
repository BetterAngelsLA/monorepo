# syntax=docker/dockerfile:1

# Runtime base: the Python app plus the system libraries GeoDjango needs
# (libpq for psycopg, gdal-bin for GDAL/GEOS/PROJ). Deliberately free of Docker,
# AWS CLI, Node, EAS, psql and the Playwright libraries: the production stage
# builds from here, and none of that is on the request path.
FROM python:3.14.8-trixie AS runtime-base

ENV PYTHONUNBUFFERED=1
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      libpq5 \
      gdal-bin \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 betterangels \
  && useradd --uid 1000 --gid betterangels --shell /bin/bash --create-home betterangels

# Python - uv (pinned version)
COPY --from=ghcr.io/astral-sh/uv:0.11.23 /uv /uvx /usr/local/bin/
ENV UV_LINK_MODE=copy

ENV PATH=/workspace/.venv/bin:$PATH:/home/betterangels/.local/bin
RUN mkdir -p /workspace/.venv && mkdir -p /workspace/node_modules /home/betterangels \
    && chown -R betterangels:betterangels /workspace /home/betterangels
WORKDIR /workspace
USER betterangels

# Development/CI base: the runtime plus the toolchain the dev container, CI and
# the Playwright stages use (Docker CLI, psql, AWS CLI, Node/EAS, Chromium libs).
# Back to root for the package installs; the stage ends as `betterangels`, which
# is how every stage below expects to run.
FROM runtime-base AS base
USER root

# Docker
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
      docker-ce-cli \
      docker-buildx-plugin \
    && docker --version

# PSQL
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    apt-get update \
    && apt-get install -y postgresql-common \
    && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y \
    && apt-get install -y postgresql-client-17

# Pin due to: https://github.com/aws/aws-cli/issues/8320
ENV AWS_CLI_VERSION=2.33.14
RUN --mount=type=cache,target=/var/cache/awscli \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
      aws_url="https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWS_CLI_VERSION}.zip"; \
    elif [ "$ARCH" = "aarch64" ]; then \
      aws_url="https://awscli.amazonaws.com/awscli-exe-linux-aarch64-${AWS_CLI_VERSION}.zip"; \
    else \
      echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    cache_zip="/var/cache/awscli/awscliv2-${AWS_CLI_VERSION}.zip" && \
    if [ ! -f "$cache_zip" ]; then \
      curl -fsSL "$aws_url" -o "$cache_zip"; \
    fi && \
    cp "$cache_zip" awscliv2.zip && \
    unzip -q awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws

# Install Node
# https://github.com/nodejs/docker-node/blob/3ac814a0a3470b195cb15530adcc3793c8268730/22/bullseye/Dockerfile
ENV NODE_VERSION=22.21.1

RUN --mount=type=cache,target=/var/cache/nodejs \
    ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  # use pre-existing gpg directory, see https://github.com/nodejs/docker-node/pull/1895#issuecomment-1550389150
  && export GNUPGHOME="$(mktemp -d)" \
  # gpg keys listed at https://github.com/nodejs/node#release-keys
  && set -ex \
  && for key in \
    5BE8A3F6C8A5C01D106C0AD820B1A390B168D356 \
    DD792F5973C6DE52C432CBDAC77ABFA00DDBF2B7 \
    CC68F5A3106FF448322E48ED27F5E38D5B0A215F \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    A363A499291CBBC940DD62E41F10027AF002F8B0 \
  ; do \
      { gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" && gpg --batch --fingerprint "$key"; } || \
      { gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" && gpg --batch --fingerprint "$key"; } ; \
  done \
  && tarball="node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && cache_tar="/var/cache/nodejs/$tarball" \
  && if [ ! -f "$cache_tar" ]; then \
       curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/$tarball" \
       && cp "$tarball" "$cache_tar"; \
     else \
       cp "$cache_tar" "$tarball"; \
     fi \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && gpgconf --kill all \
  && rm -rf "$GNUPGHOME" \
  && grep " $tarball\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "$tarball" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "$tarball" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version \
  && rm -rf /tmp/*

# Install EAS CLI globally
RUN npm install -g eas-cli@24.8.0

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    # Install Systems Packages (runtime libs come from runtime-base)
    && apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      git \
      jq \
      wget \
      zip

# Playwright (Chromium) runtime dependencies — lets devs run the Playwright e2e
# suites locally against the browser the `playwright`/`development` stages carry,
# and lets CI launch the Chromium it downloads in the e2e step.
# Provenance: snapshot of playwright-core 1.62's `debian13-x64` deps (tools +
# chromium) — not an executed version pin. After a Playwright upgrade, re-sync
# this list if a launch reports a missing shared library. See
# apps/shelter-e2e/README.md.
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    # Install Playwright (Chromium) system dependencies
    && apt-get install -y --no-install-recommends \
      xvfb \
      fonts-noto-color-emoji \
      fonts-unifont \
      libfontconfig1 \
      libfreetype6 \
      xfonts-scalable \
      fonts-liberation \
      fonts-ipafont-gothic \
      fonts-wqy-zenhei \
      fonts-tlwg-loma-otf \
      fonts-freefont-ttf \
      libasound2t64 \
      libatk-bridge2.0-0t64 \
      libatk1.0-0t64 \
      libatspi2.0-0t64 \
      libcairo2 \
      libcups2t64 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libglib2.0-0t64 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libx11-6 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2

USER betterangels

# Dependency-free base for CI. The checkout and node_modules/.venv are
# bind-mounted at runtime; ECS uses the production stage below.
FROM base AS ci-base

FROM base AS uv-stage
COPY --chown=betterangels --parents \
  pyproject.toml \
  uv.lock \
  apps/betterangels-backend/pyproject.toml \
  /workspace/
RUN --mount=type=cache,uid=1000,gid=1000,target=/home/betterangels/.cache/uv \
    uv sync --no-install-project

# Runtime venv: no dev group (pytest and friends are not on the request path).
# Built on `base` so a source-build dependency still has the toolchain; only the
# venv is copied into the runtime image, which stays on runtime-base.
FROM base AS uv-runtime
COPY --chown=betterangels --parents \
  pyproject.toml \
  uv.lock \
  apps/betterangels-backend/pyproject.toml \
  /workspace/
RUN --mount=type=cache,uid=1000,gid=1000,target=/home/betterangels/.cache/uv \
    uv sync --no-install-project --no-dev

FROM base AS yarn
COPY --chown=betterangels --parents \
  .yarnrc.yml \
  yarn.lock \
  package.json \
  .yarn \
  /workspace/
RUN --mount=type=cache,uid=1000,gid=1000,target=/workspace/.yarn/cache \
    yarn install

# Playwright's browser binaries for the dev image — installed once at build
# instead of inside every container. `FROM yarn` deliberately: the revision then
# comes from the same `yarn install` as node_modules, so it cannot drift from
# yarn.lock the way the hand-written system-library list above can.
# They land in Playwright's cache directory under $HOME, outside /workspace —
# which is why `development` inherits this stage rather than copying from it.
FROM yarn AS playwright
RUN yarn playwright install chromium

# Development Build
# Add session manager to allow Fargate sshing.
#
# `FROM playwright` on purpose: the browser is a developer tool, so the image
# that runs the e2e suites owns it, together with the node_modules it needs; the
# Python venv comes from `uv-stage`. The last stage — the one ECS and CI build
# by default — is `production`, which carries only the Python venv and the repo:
# the backend task never launches a browser or Node, so it does not copy the
# yarn stage (the CI e2e step installs Chromium itself).
FROM playwright AS development
COPY --from=uv-stage --link /workspace /workspace
USER root
RUN if [ "$(uname -m)" = "x86_64" ]; then \
      curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"; \
    elif [ "$(uname -m)" = "aarch64" ]; then \
      curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_arm64/session-manager-plugin.deb" -o "session-manager-plugin.deb"; \
    else \
      echo "Unsupported architecture"; \
      exit 1; \
    fi \
    && dpkg -i session-manager-plugin.deb \
    && rm session-manager-plugin.deb \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER betterangels
RUN git config --global --add safe.directory "*"

# Production Build
#
# The backend runtime is Python only (gunicorn, celery, manage.py) — it never
# launches Node or a browser, so the yarn stage (node_modules, ~2.3 GB in this
# monorepo) is deliberately not copied here. The image also builds on
# runtime-base, not the dev base: no Docker CLI, AWS CLI, Node, EAS, psql or
# Chromium libraries. Both cuts are pure pull time off every Fargate task, and
# skipping the yarn stage shortens the CI image build.
FROM runtime-base AS production
COPY --from=uv-runtime --link /workspace /workspace
COPY --chown=betterangels . /workspace
