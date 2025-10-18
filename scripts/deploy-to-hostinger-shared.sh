#!/bin/bash
# Script de déploiement GAMR Platform sur VPS Hostinger partagé
# Usage: ./deploy-to-hostinger-shared.sh <ip-vps> <domaine> [répertoire-app]

# Vérifier les arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <ip-vps> <domaine> [répertoire-app]"
    echo "Exemple: $0 123.456.789.012 example.com /opt/gamr"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
SSH_USER="root"
APP_DIR=${3:-"/opt/gamr"}
CURRENT_DIR=$(pwd)

echo "🚀 Déploiement de GAMR Platform sur VPS Hostinger partagé"
echo "------------------------------------------------"
echo "IP du VPS: $VPS_IP"
echo "Domaine: $DOMAIN"
echo "Répertoire d'installation: $APP_DIR"
echo "------------------------------------------------"

# Vérifier la connectivité SSH
echo "🔍 Vérification de la connectivité SSH..."
ssh -o "BatchMode=yes" -o "ConnectTimeout=5" $SSH_USER@$VPS_IP "echo SSH_CONNECTION_SUCCESSFUL" &>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Connexion SSH établie avec succès."
else
    echo "⚠️ Impossible d'établir une connexion SSH automatique."
    echo "Vous devrez peut-être entrer le mot de passe lors des prochaines étapes."
fi

# Générer un JWT secret aléatoire
JWT_SECRET=$(openssl rand -base64 32)

# Vérifier si Docker est installé sur le serveur
echo "🔍 Vérification de Docker sur le serveur..."
DOCKER_INSTALLED=$(ssh $SSH_USER@$VPS_IP "command -v docker > /dev/null && echo yes || echo no")
if [ "$DOCKER_INSTALLED" = "no" ]; then
    echo "❌ Docker n'est pas installé sur le serveur. Installation requise."
    
    read -p "Voulez-vous installer Docker? (o/n) " INSTALL_DOCKER
    if [ "$INSTALL_DOCKER" != "o" ]; then
        echo "❌ Déploiement annulé. Docker est requis pour continuer."
        exit 1
    fi
    
    echo "📋 Installation de Docker..."
    ssh $SSH_USER@$VPS_IP << EOF
    # Installer les dépendances
    apt update
    apt install -y apt-transport-https ca-certificates curl software-properties-common git
    
    # Installer Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    # Déterminer la distribution et installer le repository approprié
    DISTRO=\$(lsb_release -is | tr '[:upper:]' '[:lower:]')
    RELEASE=\$(lsb_release -cs)
    if [ "\$DISTRO" = "debian" ]; then
        # Pour Debian
        apt install -y software-properties-common
        add-apt-repository "deb [arch=\$(dpkg --print-architecture)] https://download.docker.com/linux/debian \$RELEASE stable"
    else
        # Pour Ubuntu
        add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \$RELEASE stable"
    fi
    apt update
    apt install -y docker-ce
    systemctl enable docker
    
    # Installer Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
EOF
    echo "✅ Docker installé avec succès"
fi

echo "📋 Étape 1: Préparation du répertoire d'application..."
ssh $SSH_USER@$VPS_IP << EOF
# Créer le répertoire pour l'application
mkdir -p $APP_DIR
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/backups
EOF

echo "✅ Répertoire d'application préparé"

echo "📦 Étape 2: Déploiement des fichiers..."
# Créer une archive du projet
cd $CURRENT_DIR
git archive --format=tar.gz -o gamr-deploy.tar.gz HEAD

# Vérifier si l'archive a été créée avec succès
if [ ! -f gamr-deploy.tar.gz ]; then
    echo "❌ Erreur: Impossible de créer l'archive du projet."
    echo "Veuillez vérifier que vous êtes bien dans un dépôt Git valide."
    exit 1
fi

# Transférer l'archive au serveur
scp gamr-deploy.tar.gz $SSH_USER@$VPS_IP:$APP_DIR/

# Extraire l'archive sur le serveur
ssh $SSH_USER@$VPS_IP << EOF
cd $APP_DIR
tar -xzf gamr-deploy.tar.gz
rm gamr-deploy.tar.gz

# Créer le fichier .env
cat > $APP_DIR/.env << EOT
# Configuration de base
NODE_ENV=production
PORT=3002

# Sécurité
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# URLs
FRONTEND_URL=https://$DOMAIN
CORS_ORIGIN=https://$DOMAIN

# Base de données (SQLite par défaut)
DATABASE_URL=file:/app/data/prod.db

# Limites de requêtes
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOT
EOF

echo "✅ Fichiers déployés"

echo "🔧 Étape 3: Modification de la configuration Nginx..."
CONTAINER_NAME="gamr-platform-$(echo $DOMAIN | tr '.' '-')"
ssh $SSH_USER@$VPS_IP << EOF
# Créer un fichier de configuration Nginx spécifique pour ce domaine
cat > $APP_DIR/nginx-$DOMAIN.conf << EOT
# Configuration Nginx pour GAMR Platform - $DOMAIN
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirection vers HTTPS
    location / {
        return 301 https://$DOMAIN\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL configuration - sera configuré après obtention des certificats
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Proxy vers le conteneur Docker
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOT

# Vérifier si le fichier de configuration existe déjà dans sites-available
if [ -f /etc/nginx/sites-available/$DOMAIN ]; then
    echo "Le fichier de configuration Nginx pour $DOMAIN existe déjà."
    echo "Sauvegarde de l'ancien fichier..."
    cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.bak.\$(date +%Y%m%d%H%M%S)
fi

# Copier la configuration dans sites-available
cp $APP_DIR/nginx-$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN

# Activer le site s'il n'est pas déjà activé
if [ ! -f /etc/nginx/sites-enabled/$DOMAIN ]; then
    ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
fi

# Vérifier la configuration Nginx
nginx -t && echo "Configuration Nginx valide"
EOF

echo "✅ Configuration Nginx modifiée"

echo "🔒 Étape 4: Configuration SSL avec Let's Encrypt..."
ssh $SSH_USER@$VPS_IP << EOF
# Installer Certbot si nécessaire
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Obtenir un certificat
certbot --nginx --agree-tos --non-interactive --email admin@$DOMAIN -d $DOMAIN -d www.$DOMAIN

# En cas d'échec avec www subdomain, essayer sans
if [ \$? -ne 0 ]; then
    echo "Tentative d'obtention de certificat sans le sous-domaine www..."
    certbot --nginx --agree-tos --non-interactive --email admin@$DOMAIN -d $DOMAIN
fi

# Recharger Nginx
systemctl reload nginx
EOF

echo "✅ Certificats SSL configurés"

echo "🐳 Étape 5: Déploiement avec Docker Compose..."
ssh $SSH_USER@$VPS_IP << EOF
cd $APP_DIR

# Modifier le docker-compose.prod.yml pour éviter les conflits de ports
cat > docker-compose.shared.yml << EOT
version: '3.8'

services:
  gamr-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: $CONTAINER_NAME
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=file:/app/data/prod.db
      - JWT_SECRET=$JWT_SECRET
      - JWT_EXPIRES_IN=24h
      - FRONTEND_URL=https://$DOMAIN
      - CORS_ORIGIN=https://$DOMAIN
      - VITE_API_URL=/api
      - RATE_LIMIT_WINDOW_MS=900000
      - RATE_LIMIT_MAX=100
    volumes:
      # Persistent storage for SQLite database
      - gamr-data:/app/data
      # Optional: Mount logs directory
      - gamr-logs:/app/logs
    networks:
      - gamr-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  gamr-data:
    driver: local
  gamr-logs:
    driver: local

networks:
  gamr-network:
    driver: bridge
EOT

# Déployer l'application
docker-compose -f docker-compose.shared.yml up -d --build
EOF

echo "✅ Application déployée"

echo "💾 Étape 6: Configuration des sauvegardes..."
ssh $SSH_USER@$VPS_IP << EOF
# Créer le script de sauvegarde
cat > $APP_DIR/backup.sh << EOT
#!/bin/bash
BACKUP_DIR="$APP_DIR/backups"
DATE=\\\$(date +%Y%m%d_%H%M%S)
mkdir -p \\\$BACKUP_DIR

# Sauvegarde de la base de données
docker exec $CONTAINER_NAME sqlite3 /app/data/prod.db ".backup /app/data/backup-\\\$DATE.db"
docker cp $CONTAINER_NAME:/app/data/backup-\\\$DATE.db \\\$BACKUP_DIR/

# Nettoyage des anciennes sauvegardes (garder les 7 dernières)
ls -tp \\\$BACKUP_DIR/*.db | grep -v '/\\\$' | tail -n +8 | xargs -I {} rm -- {}

# Log
echo "Sauvegarde effectuée le \\\$(date)" >> \\\$BACKUP_DIR/backup.log
EOT

# Rendre le script exécutable
chmod +x $APP_DIR/backup.sh

# Ajouter au crontab pour exécution quotidienne
(crontab -l 2>/dev/null || echo "") | grep -v "$APP_DIR/backup.sh" | { cat; echo "0 2 * * * $APP_DIR/backup.sh"; } | crontab -
EOF

echo "✅ Sauvegardes configurées"

# Vérifier que l'application est en cours d'exécution
echo "🔍 Vérification de l'application..."
ssh $SSH_USER@$VPS_IP "docker ps | grep $CONTAINER_NAME"

# Nettoyage local
rm -f gamr-deploy.tar.gz

echo "------------------------------------------------"
echo "🎉 Déploiement terminé avec succès!"
echo "------------------------------------------------"
echo "📝 Informations importantes:"
echo "- URL de l'application: https://$DOMAIN"
echo "- Conteneur Docker: $CONTAINER_NAME"
echo "- Emplacement des backups: $APP_DIR/backups"
echo "- Logs: docker logs $CONTAINER_NAME"
echo "------------------------------------------------"
echo "Pour vous connecter au serveur: ssh $SSH_USER@$VPS_IP"
echo "Pour plus d'informations, consultez le fichier HOSTINGER_DEPLOYMENT.md"
echo "------------------------------------------------"
