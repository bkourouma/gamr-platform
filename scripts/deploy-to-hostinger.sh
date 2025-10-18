#!/bin/bash
# Script de déploiement GAMR Platform sur VPS Hostinger
# Usage: ./deploy-to-hostinger.sh <ip-vps> <domaine>

# Vérifier les arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <ip-vps> <domaine>"
    echo "Exemple: $0 123.456.789.012 example.com"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
SSH_USER="root"
APP_DIR="/opt/gamr"
CURRENT_DIR=$(pwd)

echo "🚀 Déploiement de GAMR Platform sur VPS Hostinger"
echo "------------------------------------------------"
echo "IP du VPS: $VPS_IP"
echo "Domaine: $DOMAIN"
echo "------------------------------------------------"

# Générer un JWT secret aléatoire
JWT_SECRET=$(openssl rand -base64 32)

echo "📋 Étape 1: Préparation du serveur distant..."
ssh $SSH_USER@$VPS_IP << EOF
    # Mettre à jour le système
    apt update && apt upgrade -y
    
    # Installer les dépendances
    apt install -y apt-transport-https ca-certificates curl software-properties-common git ufw
    
    # Configurer le pare-feu
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw --force enable
    
    # Configurer le fuseau horaire
    timedatectl set-timezone Europe/Paris
    
    # Installer Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable"
    apt update
    apt install -y docker-ce
    systemctl enable docker
    
    # Installer Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Créer le répertoire pour l'application
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/nginx/ssl
    mkdir -p $APP_DIR/backups
EOF

echo "✅ Configuration du serveur terminée"

echo "📦 Étape 2: Déploiement des fichiers..."
# Créer une archive du projet
cd $CURRENT_DIR
git archive --format=tar.gz -o gamr-deploy.tar.gz HEAD

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

echo "🔒 Étape 3: Configuration SSL avec Let's Encrypt..."
ssh $SSH_USER@$VPS_IP << EOF
    # Installer Certbot
    apt install -y certbot
    
    # Arrêter temporairement les services qui pourraient utiliser le port 80
    docker-compose -f $APP_DIR/docker-compose.prod.yml down 2>/dev/null || true
    
    # Obtenir un certificat
    certbot certonly --standalone --agree-tos --non-interactive --email admin@$DOMAIN -d $DOMAIN -d www.$DOMAIN
    
    # Copier les certificats pour Nginx
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/nginx/ssl/key.pem
    
    # Configurer le renouvellement automatique
    echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/nginx/ssl/key.pem && docker-compose -f $APP_DIR/docker-compose.prod.yml restart nginx" | tee -a /etc/crontab > /dev/null
EOF

echo "✅ Certificats SSL configurés"

echo "🐳 Étape 4: Déploiement avec Docker Compose..."
ssh $SSH_USER@$VPS_IP << EOF
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml up -d
EOF

echo "✅ Application déployée"

echo "💾 Étape 5: Configuration des sauvegardes..."
ssh $SSH_USER@$VPS_IP << EOF
    # Créer le script de sauvegarde
    cat > $APP_DIR/backup.sh << 'EOT'
#!/bin/bash
BACKUP_DIR="$APP_DIR/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Sauvegarde de la base de données
docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /app/data/backup-\$DATE.db"
docker cp gamr-platform:/app/data/backup-\$DATE.db \$BACKUP_DIR/

# Nettoyage des anciennes sauvegardes (garder les 7 dernières)
ls -tp \$BACKUP_DIR/*.db | grep -v '/\$' | tail -n +8 | xargs -I {} rm -- {}

# Log
echo "Sauvegarde effectuée le \$(date)" >> \$BACKUP_DIR/backup.log
EOT
    
    # Rendre le script exécutable
    chmod +x $APP_DIR/backup.sh
    
    # Ajouter au crontab pour exécution quotidienne
    echo "0 2 * * * root $APP_DIR/backup.sh" | tee -a /etc/crontab
EOF

echo "✅ Sauvegardes configurées"

echo "📊 Étape 6: Installation de Netdata pour le monitoring..."
ssh $SSH_USER@$VPS_IP << EOF
    # Installer Netdata
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait
    
    # Configurer le pare-feu pour le port Netdata
    ufw allow 19999/tcp
EOF

echo "✅ Monitoring configuré"

echo "🔐 Étape 7: Configuration de la sécurité supplémentaire..."
ssh $SSH_USER@$VPS_IP << EOF
    # Installer Fail2Ban
    apt install -y fail2ban
    
    # Configurer pour SSH
    cat > /etc/fail2ban/jail.local << 'EOT'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOT
    
    # Redémarrer Fail2Ban
    systemctl restart fail2ban
EOF

echo "✅ Sécurité configurée"

# Vérifier que l'application est en cours d'exécution
echo "🔍 Vérification de l'application..."
ssh $SSH_USER@$VPS_IP "docker ps | grep gamr-platform"

# Nettoyage local
rm -f gamr-deploy.tar.gz

echo "------------------------------------------------"
echo "🎉 Déploiement terminé avec succès!"
echo "------------------------------------------------"
echo "📝 Informations importantes:"
echo "- URL de l'application: https://$DOMAIN"
echo "- URL du monitoring: http://$VPS_IP:19999"
echo "- Emplacement des backups: $APP_DIR/backups"
echo "- Logs: docker logs gamr-platform"
echo "------------------------------------------------"
echo "Pour vous connecter au serveur: ssh $SSH_USER@$VPS_IP"
echo "Pour plus d'informations, consultez le fichier HOSTINGER_DEPLOYMENT.md"
echo "------------------------------------------------"
