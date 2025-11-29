#!/bin/bash
# =============================================================================
# GAMR Platform - Script de configuration VPS (SANS affecter les autres apps)
# Sous-domaine: gamrdigitale.engage-360.net
# Port: 3005
# =============================================================================

set -e

APP_NAME="gamr-platform"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="gamrdigitale.engage-360.net"
PORT=3005
REPO_URL="https://github.com/bkourouma/gamr-platform.git"

echo "=========================================="
echo "🚀 Configuration GAMR Platform"
echo "   Domaine: $DOMAIN"
echo "   Port: $PORT"
echo "   Répertoire: $APP_DIR"
echo "=========================================="

# Vérifier que le port est libre
if netstat -tlnp | grep -q ":$PORT "; then
    echo "❌ ERREUR: Le port $PORT est déjà utilisé!"
    exit 1
fi
echo "✅ Port $PORT disponible"

# Créer le répertoire de l'application
echo "📁 Création du répertoire $APP_DIR..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs

# Installer Node.js 20 si pas installé
if ! command -v node &> /dev/null; then
    echo "📦 Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "✅ Node.js $(node -v)"

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation de PM2..."
    npm install -g pm2
fi
echo "✅ PM2 installé"

# Cloner ou mettre à jour le repo
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Mise à jour du repository..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/master
else
    echo "📥 Clonage du repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
cd $APP_DIR
npm ci --production=false

# Build de l'application
echo "🔨 Build de l'application..."
npm run build

# Configurer Prisma
echo "🗄️ Configuration de la base de données..."
npx prisma generate
npx prisma db push

# Seed de la base de données (première installation)
if [ ! -f "$APP_DIR/prisma/prod.db" ]; then
    echo "🌱 Seed de la base de données..."
    npm run db:seed || true
fi

# Copier le fichier ecosystem PM2
echo "⚙️ Configuration PM2..."
cp $APP_DIR/deployment/ecosystem.config.cjs $APP_DIR/ecosystem.config.cjs

# Configurer Nginx (fichier séparé - n'affecte pas les autres configs)
echo "🌐 Configuration Nginx..."
cp $APP_DIR/deployment/nginx/gamrdigitale.engage-360.net.conf /etc/nginx/sites-available/$DOMAIN

# Créer le lien symbolique si pas existant
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
fi

# Tester la configuration Nginx
echo "🔍 Test de la configuration Nginx..."
nginx -t

echo ""
echo "=========================================="
echo "✅ Configuration terminée!"
echo ""
echo "Prochaines étapes:"
echo "1. Générer le certificat SSL:"
echo "   certbot certonly --webroot -w /var/www/html -d $DOMAIN"
echo ""
echo "2. Démarrer l'application:"
echo "   cd $APP_DIR && pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo ""
echo "3. Recharger Nginx:"
echo "   systemctl reload nginx"
echo "=========================================="

