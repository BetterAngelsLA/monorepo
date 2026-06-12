# Using Your SSH Agent Inside the Dev Container

VS Code's Dev Container automatically forwards your host's SSH agent socket into the
container. This lets you authenticate with GitHub (and other SSH hosts) from inside the
container **without copying your private keys** — the decrypted keys stay in memory on your
host and are never exposed to the container filesystem.

## How It Works

1. VS Code mounts the SSH agent socket (`SSH_AUTH_SOCK`) from your host into the
   container.
2. When an SSH connection is made inside the container, it talks to your host's `ssh-agent`
   through that socket.
3. Your private keys are never written to the container's filesystem (`~/.ssh/` inside the
   container only contains `known_hosts`).

## Prerequisites

- `ssh-agent` running on your **host** machine
- Your GitHub SSH key loaded into the agent

## Step-by-Step Setup

### 1. Ensure ssh-agent is running on your host

**macOS:**

```bash
eval "$(ssh-agent -s)"
```

**Linux:**

```bash
eval "$(ssh-agent -s)"
```

**Windows (Git Bash / WSL2):**

```bash
eval "$(ssh-agent -s)"
```

> **Tip:** macOS typically starts `ssh-agent` automatically. On most Linux desktops,
> `ssh-agent` is already running as part of the user session.

### 2. Add your SSH key to the agent

Replace the key path below with your actual private key file.

**If your key is `id_ed25519`:**

```bash
ssh-add ~/.ssh/id_ed25519
```

**If your key is `id_rsa`:**

```bash
ssh-add ~/.ssh/id_rsa
```

**If your key has a different name:**

```bash
ssh-add ~/.ssh/<your-private-key>
```

> **Note:** If your key has a passphrase, you'll be prompted to enter it once. After that,
> the decrypted key is held in memory by the agent.

### 3. Verify the key is loaded

On your **host**:

```bash
ssh-add -l
```

You should see output like:

```
256 SHA256:abc123... you@example.com (ED25519)
```

or

```
3072 SHA256:def456... you@example.com (RSA)
```

### 4. Test GitHub authentication from inside the container

Once the container is running, open a terminal inside VS Code and run:

```bash
ssh -T git@github.com
```

A successful response looks like:

```
Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.
```

## Troubleshooting

### "The agent has no identities" inside the container

Run `ssh-add` on your **host** to load your key into the agent. The identities are not
persisted across reboots.

### "Permission denied (publickey)" when connecting to GitHub

1. Confirm your key is loaded: `ssh-add -l` on your host
2. Confirm GitHub has your **public** key: https://github.com/settings/keys
3. Confirm the key matches: `ssh-keygen -lf ~/.ssh/id_ed25519.pub` on your host should
   match what `ssh-add -l` reports

### SSH agent socket not found inside the container

Check that `SSH_AUTH_SOCK` is set:

```bash
echo $SSH_AUTH_SOCK
```

It should show something like `/tmp/vscode-ssh-auth-*.sock`. If not, try rebuilding the
container: **F1 → Dev Containers: Rebuild Container**.

### Agent loses identities after reboot

You need to run `ssh-add` again after each reboot. To automate this, add the following to
your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) on your **host**:

```bash
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)"
fi
ssh-add -q ~/.ssh/id_ed25519 2>/dev/null
```

Replace `id_ed25519` with your key's filename (`id_rsa`, etc.).

## Using SSH with Git

Once the agent is working, you can use SSH-based git operations inside the container:

```bash
# Clone a repo via SSH
git clone git@github.com:org/repo.git

# Change an existing repo's remote from HTTPS to SSH
git remote set-url origin git@github.com:org/repo.git

# Push, pull, fetch all work normally
git push origin main
```

## Using AI Coding Assistants

With the SSH agent forwarded, AI coding assistants like Cline can perform git operations
(commit, push, create PRs, clone repos) directly from inside the dev container. The Cline
extension is pre-installed — see [cline.md](./cline.md) for setup and
[devcontainer.md](./devcontainer.md) for overall dev container configuration.
