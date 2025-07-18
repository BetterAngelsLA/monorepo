FROM python:3.13.5-bullseye AS base

ENV PYTHONUNBUFFERED=1
RUN groupadd --gid 1000 betterangels \
  && useradd --uid 1000 --gid betterangels --shell /bin/bash --create-home betterangels

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
    && apt-get install -y \
      docker-ce \
      docker-ce-cli \
      containerd.io \
      docker-buildx-plugin \
    && docker --version

# PSQL
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    apt-get update \
    && apt-get install -y postgresql-common \
    && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y \
    && apt-get install -y postgresql-client-16

# Pin due to: https://github.com/aws/aws-cli/issues/8320
ENV AWS_CLI_VERSION=2.24.21
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "x86_64" ]; then \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWS_CLI_VERSION}.zip" -o "awscliv2.zip"; \
  elif [ "$ARCH" = "aarch64" ]; then \
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64-${AWS_CLI_VERSION}.zip" -o "awscliv2.zip"; \
  else \
    echo "Unsupported architecture: $ARCH" && exit 1; \
  fi && \
  unzip awscliv2.zip && \
  ./aws/install && \
  rm awscliv2.zip

# Install Node
# https://github.com/nodejs/docker-node/blob/3ac814a0a3470b195cb15530adcc3793c8268730/22/bullseye/Dockerfile
ENV NODE_VERSION=22.14.0

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
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
    C0D6248439F1D5604AAFFB4021D900FFDB233756 \
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
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && gpgconf --kill all \
  && rm -rf "$GNUPGHOME" \
  && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version \
  && rm -rf /tmp/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Python
RUN pip install poetry==2.1.1
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    # Install Systems Packages
    && apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      git \
      jq \
      wget \
      zip \
    # Install Python Lib Requirements
    && apt-get install -y \
    libpq5 \
    gdal-bin
ENV PATH=/workspace/.venv/bin:$PATH:$HOME/.local/bin
RUN mkdir -p /workspace/.venv mkdir -p /workspace/node_modules  \
    && chown -R betterangels:betterangels /workspace
WORKDIR /workspace
USER betterangels

# Development Build
# Add session manager to allow Fargate sshing
FROM base AS development
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
USER betterangels
RUN git config --global --add safe.directory "*"

FROM base AS poetry
# Need to create bare Python Packages otherwise poetry will explode (sadpanda)
COPY --chown=betterangels poetry.lock poetry.toml pyproject.toml /workspace/
COPY --chown=betterangels apps/betterangels-backend/pyproject.toml /workspace/apps/betterangels-backend/pyproject.toml
COPY --chown=betterangels apps/betterangels-backend/betterangels_backend/__init__.py /workspace/apps/betterangels-backend/betterangels_backend/__init__.py
RUN --mount=type=cache,uid=1000,gid=1000,target=/home/betterangels/.cache/pypoetry \
    poetry install --no-interaction --no-ansi

FROM base AS yarn
COPY --chown=betterangels .yarnrc.yml yarn.lock package.json .yarnrc.yml /workspace/
COPY --chown=betterangels .yarn /workspace/.yarn
RUN --mount=type=cache,uid=1000,gid=1000,target=/workspace/.yarn/cache \
    yarn install

# Production Build
FROM base AS production
COPY --from=poetry /workspace /workspace
COPY --from=yarn /workspace /workspace
COPY --chown=betterangels . /workspace
