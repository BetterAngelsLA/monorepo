FROM nikolaik/python-nodejs:python3.11-nodejs20-bullseye

# TODO: This is only for dev so we can likely make this a dev target instead of global
RUN mkdir -p /workspace/node_modules /workspace/.venv \
    && chown -R pn:pn /workspace/node_modules /workspace/.venv
VOLUME ["/workspace/node_modules", "/workspace/.venv"]
USER pn
