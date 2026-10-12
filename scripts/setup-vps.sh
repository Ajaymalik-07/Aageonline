#!/usr/bin/env bash
# ==============================================================================
# AageOnline — Automated VPS Host Hardening & Docker Setup Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS (x86_64 / aarch64)
# Usage: sudo bash scripts/setup-vps.sh
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  AageOnline — VPS Provisioning & Security Hardening     "
echo "  Target: aageonline.com                                 "
echo "=========================================================="

if [[ $EUID -ne 0 ]]; then
   echo "[ERROR] This script must be run as root or with sudo privileges." >&2
   exit 1
fi

# 1. Update OS Packages
echo "[1/6] Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg ufw git openssl

# 2. Configure Host Firewall (UFW)
# CRITICAL: Configure SSH rules BEFORE enabling UFW to prevent lockout
echo "[2/6] Configuring host firewall (UFW)..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (Port 22)
ufw allow 22/tcp comment 'SSH Remote Access'

# Allow HTTP and HTTPS for Caddy Reverse Proxy & ACME TLS
ufw allow 80/tcp comment 'Caddy HTTP & ACME Challenge'
ufw allow 443/tcp comment 'Caddy HTTPS'
ufw allow 443/udp comment 'Caddy HTTP/3 QUIC'

# Explicitly ensure application port 3000 and DB port 5432 are NOT exposed publicly.
# NOTE ON DOCKER & UFW: Docker manipulates iptables directly and bypasses standard UFW
# rules for published ports (ports:). Therefore, docker-compose.yml strictly uses
# internal container networking (expose: 3000) instead of publishing port 3000 to the host.
ufw deny 3000/tcp comment 'Block Direct Next.js Port'
ufw deny 5432/tcp comment 'Block Direct Postgres Port'

# Enable UFW non-interactively
echo "y" | ufw enable
ufw status verbose

# 3. Install Official Docker Engine & Compose Plugin (Idempotent)
echo "[3/6] Installing Docker Engine & Compose plugin..."
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    echo "[SUCCESS] Docker Engine installed successfully."
else
    echo "[INFO] Docker Engine is already installed: $(docker --version)"
fi

# 4. Prepare Deployment Directory
DEPLOY_DIR="/opt/aageonline"
echo "[4/6] Preparing deployment directory at ${DEPLOY_DIR}..."
mkdir -p "${DEPLOY_DIR}"
DEPLOY_USER="${SUDO_USER:-$USER}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_DIR}"

# 5. Add Deploy User to Docker Group (Optional convenience)
# SECURITY NOTICE: Membership in the 'docker' group provides root-equivalent access on the host.
# Only trusted deployment operators should be added.
if [[ -n "${SUDO_USER:-}" ]]; then
    usermod -aG docker "${SUDO_USER}"
    echo "[INFO] Added user '${SUDO_USER}' to the docker group."
    echo "[SECURITY NOTICE] User '${SUDO_USER}' now has root-equivalent access via Docker socket."
fi

# 6. Verify Host Hardening & Ports
echo "[5/6] Verifying host port exposure..."
OPEN_PORTS=$(ss -tuln || true)
echo "${OPEN_PORTS}"

echo "[6/6] Host setup complete!"
echo "----------------------------------------------------------"
echo "Next Steps:"
echo "1. Clone repository into ${DEPLOY_DIR} (if not already present):"
echo "   cd ${DEPLOY_DIR} && git clone https://github.com/Ajaymalik-07/Aageonline.git ."
echo "2. Copy and configure production environment:"
echo "   cp .env.production.example .env.production && chmod 600 .env.production"
echo "3. Run deployment script:"
echo "   bash scripts/deploy.sh"
echo "=========================================================="
