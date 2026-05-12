#!/usr/bin/env bash
set -e

echo "Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Make bun available in current shell and future shells
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Persist for zsh / bash
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zshrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zshrc

echo "Bun $(bun --version) installed successfully."
