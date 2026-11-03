#!/usr/bin/env bash
# Sayaç PWA'yı GitHub Pages'e yükler. Kullanım: ./deploy.sh [repo-adi]
set -euo pipefail
REPO="${1:-counter}"
cd "$(dirname "$0")"
command -v gh >/dev/null || { echo "gh CLI gerekli: https://cli.github.com  (sonra: gh auth login)"; exit 1; }
OWNER="$(gh api user -q .login)"
[ -d .git ] || git init -q -b main
git add -A
git commit -qm "Sayaç PWA" 2>/dev/null || true
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$OWNER/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" --public --source=. --remote=origin --push
fi
gh api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || echo "(Pages zaten açık olabilir)"
echo
echo "Bir dakika içinde hazır: https://$OWNER.github.io/$REPO/"
echo "Telefonda aç → Android: menü › Ana ekrana ekle | iPhone: Paylaş › Ana Ekrana Ekle"
