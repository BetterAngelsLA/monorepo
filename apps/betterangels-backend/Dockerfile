FROM python:3.11.5-bullseye

ENV PYTHONUNBUFFERED=1
RUN groupadd --gid 1000 betterangels \
  && useradd --uid 1000 --gid betterangels --shell /bin/bash --create-home betterangels

# Python
RUN pip install poetry==1.6.1

RUN apt-get update \
    # Install Python Lib Requirements
    && apt-get install -y \
    libpq5 \
    gdal-bin \
    # Probably want to remove the client before we merge this
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER betterangels
ENV PATH /workspace/.venv/bin:$PATH:$HOME/.local/bin
COPY --chown=betterangels poetry.lock poetry.toml pyproject.toml /workspace/
COPY --chown=betterangels apps/betterangels-backend/poetry.toml apps/betterangels-backend/pyproject.toml /workspace/apps/betterangels-backend/
RUN cd /workspace && poetry install --no-interaction --no-ansi
COPY --chown=betterangels apps/betterangels-backend/ /workspace/apps/betterangels-backend/
WORKDIR /workspace/apps/betterangels-backend
RUN python manage.py collectstatic --noinput
