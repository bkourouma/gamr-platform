#!/bin/bash
# =============================================================================
# GAMR Platform - Script de déploiement Hostinger (SANS Docker)
# Exécuter sur le VPS pour mettre à jour l'application
# N'affecte PAS les autres applications
# =============================================================================

set -e

APP_NAME="gamr-platform"
APP_DIR="/var/www/$APP_NAME"

echo "🚀 Déploiement GAMR Platform sur Hostinger..."
echo "   Répertoire: $APP_DIR"
echo ""

cd $APP_DIR

# Récupérer les dernières modifications
echo "📥 Pull des dernières modifications..."
git fetch origin
git reset --hard origin/master

# Installer les nouvelles dépendances
echo "📦 Installation des dépendances..."
npm ci --production=false

# Build
echo "🔨 Build de l'application..."
npm run build

# Mettre à jour Prisma si nécessaire
echo "🗄️ Mise à jour de la base de données..."
npx prisma generate
npx prisma db push

# Redémarrer l'application avec PM2 (sans affecter les autres apps)
echo "🔄 Redémarrage de l'application..."
pm2 restart $APP_NAME --update-env

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📊 Vérification du status:"
pm2 status $APP_NAME
echo ""
echo "📜 Pour voir les logs: pm2 logs $APP_NAME"
echo "🔗 URL: https://gamrdigitale.engage-360.net"

