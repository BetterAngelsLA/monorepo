ARG ATLANTIS
ARG TERRAFORM
ARG TERRAGRUNT
ARG TERRAGRUNT_ATLANTIS_CONFIG
ARG ATLANTIS_USER

FROM ghcr.io/runatlantis/atlantis:$ATLANTIS

USER root

RUN apk add --no-cache \
    bash \
    git \
    openssh \
    curl \
    jq \
    yq \
    aws-cli \
    python3 \
    py3-pip \
    unzip

# Install Terraform
RUN set -ex \
    && mkdir -p "/usr/local/bin/terraform/versions/${TERRAFORM}" \
    && cd "/usr/local/bin/terraform/versions/${TERRAFORM}"
RUN set -ex \
    && curl -sSL -o /tmp/terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM}/terraform_${TERRAFORM}_linux_amd64.zip" \
    && unzip /tmp/terraform.zip -d "/usr/local/bin/terraform/versions/${TERRAFORM}" \
    && rm -f /tmp/terraform.zip \
    && ln -s "/usr/local/bin/terraform/versions/${TERRAFORM}/terraform" /usr/local/bin/terraform \
    && terraform --version

# Install Terragrunt
RUN curl -LO https://github.com/gruntwork-io/terragrunt/releases/download/v${TERRAGRUNT}/terragrunt_linux_amd64 && \
    chmod +x terragrunt_linux_amd64 && \
    mv terragrunt_linux_amd64 /usr/local/bin/terragrunt \
    && terragrunt --version

# Install Terragrunt Atlantis Config
RUN cd /usr/local/bin \
    && curl -sSL -o https://github.com/transcend-io/terragrunt-atlantis-config/releases/download/v${TERRAGRUNT_ATLANTIS_CONFIG}/terragrunt-atlantis-config_${TERRAGRUNT_ATLANTIS_CONFIG}_linux_amd64 -o /usr/local/bin/terragrunt-atlantis-config \
    && chmod +x terragrunt-atlantis-config

USER §ATLANTIS_USER
