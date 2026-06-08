# Cline

[Cline](https://github.com/cline/cline) is an AI coding assistant that runs directly in VS
Code. It's included in our dev container so every developer has it available automatically.

## Why Cline

Cline can read, write, edit, and run code across the entire monorepo with full project
context. Combined with SSH agent forwarding (see
[dev_container_ssh.md](./dev_container_ssh.md)), it can do git operations and push directly
to GitHub from inside the container.

## Bring Your Own Key

Cline is **bring your own key** — you use your own API keys and pay only for the tokens you
use. No per-seat licensing.

We're currently testing **Cline + DeepSeek V4** as our recommended workflow. DeepSeek and
Mimo (Moonshot) are dramatically cheaper than Anthropic/OpenAI models — roughly **90% less**
— while still delivering strong results for day-to-day development.

For setup instructions and available models, see the
[Cline documentation](https://docs.cline.bot).
