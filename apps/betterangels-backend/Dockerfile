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
ENV PATH /app/.venv/bin:$PATH:$HOME/.local/bin
# TODO copy the poetry files first
COPY --chown=betterangels . /workspace/
WORKDIR /app/
RUN poetry install --no-interaction --no-ansi
WORKDIR /workspace/apps/betterangels-backend
RUN python manage.py collectstatic --noinput
