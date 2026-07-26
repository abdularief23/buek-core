#!/usr/bin/env bash
# Run ONCE on the VPS (SumoPod Web Console) to enable GitHub Actions auto-deploy.
# After this, add the printed secrets to GitHub → Settings → Secrets → Actions.
set -euo pipefail

KEY_PATH="$HOME/.ssh/buek_github_actions"
PUB_PATH="${KEY_PATH}.pub"

echo "=== Buek Core — GitHub Actions SSH Setup ==="
echo ""

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ -f "$KEY_PATH" ]; then
  echo "==> Existing key found at $KEY_PATH (reusing)"
else
  echo "==> Generating new SSH key pair..."
  ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "buek-core-github-actions"
fi

touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"
PUB_KEY="$(cat "$PUB_PATH")"
if ! grep -qF "$PUB_KEY" "$HOME/.ssh/authorized_keys" 2>/dev/null; then
  echo "$PUB_KEY" >> "$HOME/.ssh/authorized_keys"
  echo "==> Public key added to ~/.ssh/authorized_keys"
else
  echo "==> Public key already in authorized_keys"
fi

VPS_USER="$(whoami)"
VPS_HOST="$(curl -s --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

echo ""
echo "=============================================="
echo "  ADD THESE TO GITHUB SECRETS (one-time)"
echo "  https://github.com/abdularief23/buek-core/settings/secrets/actions"
echo "=============================================="
echo ""
echo "Secret name: VPS_HOST"
echo "Value:"
echo "43.157.226.203"
echo ""
echo "Secret name: VPS_USER"
echo "Value:"
echo "$VPS_USER"
echo ""
echo "Secret name: VPS_PORT"
echo "Value:"
echo "22"
echo ""
echo "Secret name: SSH_PRIVATE_KEY"
echo "Value: (copy everything below, including BEGIN/END lines)"
echo "----------------------------------------------"
cat "$KEY_PATH"
echo "----------------------------------------------"
echo ""
echo "After adding secrets, trigger deploy:"
echo "https://github.com/abdularief23/buek-core/actions/workflows/deploy.yml"
echo "→ Run workflow"
echo ""
echo "Or push any commit to main."
echo "=== Done ==="
