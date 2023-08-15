FROM nikolaik/python-nodejs:python3.11-nodejs20-bullseye

RUN mkdir -p /workspace/node_modules /workspace/.venv \
    && chown -R pn:pn /workspace/node_modules /workspace/.venv
VOLUME ["/workspace/node_modules", "/workspace/.venv"]
USER pn
