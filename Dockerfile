FROM python:3.12.2-bullseye AS base

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

# Pin due to: https://github.com/aws/aws-cli/issues/8320
ENV AWS_CLI_VERSION=2.15.19
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
# https://github.com/nodejs/docker-node/blob/151ec75067877000120d634fc7fd2a18c544e3d4/18/bullseye/Dockerfile
ENV NODE_VERSION 20.13.11
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && ARCH= && dpkgArch="$(dpkg --print-architecture)" \
    && case "${dpkgArch##*-}" in \
      amd64) ARCH='x64';; \
      ppc64el) ARCH='ppc64le';; \
      s390x) ARCH='s390x';; \
      arm64) ARCH='arm64';; \
      armhf) ARCH='armv7l';; \
      i386) ARCH='x86';; \
      *) echo "unsupported architecture"; exit 1 ;; \
    esac \
    && set -ex \
    # libatomic1 for arm
    && apt-get update && apt-get install -y ca-certificates curl wget gnupg dirmngr xz-utils libatomic1 --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && for key in \
      4ED778F539E3634C779C87C6D7062848A1AB005C \
      141F07595B7B3FFE74309A937405533BE57C7D57 \
      74F12602B6F1C4E913FAA37AD3A89613643B6201 \
      DD792F5973C6DE52C432CBDAC77ABFA00DDBF2B7 \
      61FC681DFB92A079F1685E77973F295594EC4689 \
      8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
      C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
      890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
      C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
      108F52B48DB57BB0CC439B2997B01419BD92F80A \
    ; do \
      gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
      gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
    && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && apt-mark auto '.*' > /dev/null \
    && find /usr/local -type f -executable -exec ldd '{}' ';' \
      | awk '/=>/ { so = $(NF-1); if (index(so, "/usr/local/") == 1) { next }; gsub("^/(usr/)?", "", so); print so }' \
      | sort -u \
      | xargs -r dpkg-query --search \
      | cut -d: -f1 \
      | sort -u \
      | xargs -r apt-mark manual \
    # smoke tests
    && node --version \
    && npm --version

ENV YARN_VERSION 3.6.3
RUN corepack enable && \
    yarn set version $YARN_VERSION && \
    # smoke tests
    yarn --version

# Python
RUN pip install poetry==1.8.2
RUN --mount=type=cache,target=/var/lib/apt/lists --mount=target=/var/cache/apt,type=cache \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    # Install Systems Packages
    && apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      git \
      wget \
      zip \
    # Install Python Lib Requirements
    && apt-get install -y \
    libpq5 \
    gdal-bin
ENV PATH /workspace/.venv/bin:$PATH:$HOME/.local/bin
RUN mkdir -p /workspace/.venv mkdir -p /workspace/node_modules  \
    && chown -R betterangels:betterangels /workspace
WORKDIR /workspace
USER betterangels

# Development Build
# Add session manager to allow Fargate sshing
FROM base as development
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

FROM base as poetry
# Need to create bare Python Packages otherwise poetry will explode (sadpanda)
COPY --chown=betterangels poetry.lock poetry.toml pyproject.toml /workspace/
COPY --chown=betterangels apps/betterangels-backend/pyproject.toml /workspace/apps/betterangels-backend/pyproject.toml
COPY --chown=betterangels apps/betterangels-backend/betterangels_backend/__init__.py /workspace/apps/betterangels-backend/betterangels_backend/__init__.py
RUN --mount=type=cache,uid=1000,gid=1000,target=/home/betterangels/.cache/pypoetry \
    poetry install --no-interaction --no-ansi

FROM base as yarn
COPY --chown=betterangels .yarnrc.yml yarn.lock package.json .yarnrc.yml /workspace/
COPY --chown=betterangels .yarn /workspace/.yarn
RUN --mount=type=cache,uid=1000,gid=1000,target=/workspace/.yarn/cache \
    yarn install

# Production Build
FROM base AS production
COPY --from=poetry /workspace /workspace
COPY --from=yarn /workspace /workspace
COPY --chown=betterangels . /workspace
