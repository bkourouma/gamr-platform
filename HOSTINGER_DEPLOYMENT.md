# 🚀 GAMR Platform - Déploiement sur VPS Hostinger

Ce guide détaille les étapes pour déployer la plateforme GAMR sur un VPS Hostinger totalement neuf.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Première Connexion au VPS](#première-connexion-au-vps)
- [Configuration du VPS](#configuration-du-vps)
- [Installation de Docker](#installation-de-docker)
- [Configuration DNS](#configuration-dns)
- [Déploiement de l'Application](#déploiement-de-lapplication)
- [Configuration SSL](#configuration-ssl)
- [Sauvegarde et Maintenance](#sauvegarde-et-maintenance)
- [Dépannage](#dépannage)

## 🛠️ Prérequis

- Un compte Hostinger avec un VPS nouvellement créé (recommandé: au moins 2 vCPU, 4GB RAM)
- Un nom de domaine configuré dans Hostinger
- Accès SSH au VPS (informations de connexion fournies par Hostinger)
- Accès au repository Git du projet GAMR sur votre machine locale

## 🔰 Première Connexion au VPS

### Étape 1: Se connecter au VPS via SSH

```bash
ssh root@votre-ip-vps
```

### Étape 2: Changer le mot de passe root

Pour des raisons de sécurité, changez immédiatement le mot de passe root fourni par Hostinger:

```bash
passwd
```

Entrez un nouveau mot de passe fort et sécurisé.

## 💻 Configuration du VPS

### Étape 1: Vérifier le système d'exploitation

```bash
cat /etc/os-release
```

Cette commande affichera les informations sur la distribution Linux installée sur votre VPS.

### Étape 2: Mettre à jour le système

```bash
apt update && apt upgrade -y
```

### Étape 3: Configurer le pare-feu

```bash
# Installer UFW si non présent
apt install -y ufw

# Configurer les règles de base
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https

# Activer le pare-feu
ufw enable
```

### Étape 4: Configurer le fuseau horaire

```bash
timedatectl set-timezone Europe/Paris
```

## 🐳 Installation de Docker

### Étape 1: Installer Docker

```bash
# Installer les dépendances
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Ajouter la clé GPG officielle de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# Ajouter le repository Docker (dépend de la distribution)
DISTRO=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
RELEASE=$(lsb_release -cs)

if [ "$DISTRO" = "debian" ]; then
    # Pour Debian
    apt install -y software-properties-common
    add-apt-repository "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/debian $RELEASE stable"
else
    # Pour Ubuntu
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $RELEASE stable"
fi

# Mettre à jour et installer Docker
apt update
apt install -y docker-ce

# Vérifier l'installation
docker --version
```

### Étape 2: Installer Docker Compose

```bash
# Installer Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Rendre le binaire exécutable
chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker-compose --version
```

### Étape 3: Configurer Docker pour démarrer au boot

```bash
systemctl enable docker
```

## 🌐 Configuration DNS

### Étape 1: Configurer les enregistrements DNS dans le panel Hostinger

1. Connectez-vous à votre compte Hostinger
2. Accédez à la section "DNS / Nameservers"
3. Ajoutez les enregistrements suivants:
   - Type: A, Nom: @, Valeur: [Votre IP VPS], TTL: 300
   - Type: A, Nom: www, Valeur: [Votre IP VPS], TTL: 300

### Étape 2: Vérifier la propagation DNS

Utilisez un outil comme [dnschecker.org](https://dnschecker.org) pour vérifier la propagation de vos enregistrements DNS.

## 📦 Déploiement de l'Application

### Étape 1: Préparer le répertoire de l'application

```bash
# Créer un répertoire pour l'application
mkdir -p /opt/gamr
cd /opt/gamr
mkdir -p nginx/ssl
mkdir -p backups
```

### Étape 2: Déployer avec les scripts automatiques

Le moyen le plus simple de déployer l'application est d'utiliser les scripts de déploiement automatiques depuis votre machine locale:

**Pour Windows (PowerShell):**
```powershell
.\scripts\deploy-to-hostinger.ps1 -VpsIp "votre-ip-vps" -Domain "votre-domaine.com"
```

**Pour Linux/Mac:**
```bash
chmod +x scripts/deploy-to-hostinger.sh
./scripts/deploy-to-hostinger.sh votre-ip-vps votre-domaine.com
```

Ces scripts effectuent automatiquement toutes les étapes nécessaires pour déployer l'application sur un VPS neuf.

### Étape 3 (Alternative): Déploiement manuel

Si vous préférez déployer manuellement, vous pouvez suivre ces étapes:

```bash
# Cloner le repository
cd /opt/gamr
git clone <repository-url> .
```

### Étape 4 (Déploiement manuel): Configurer les variables d'environnement

```bash
# Créer le fichier .env
touch .env

# Éditer le fichier avec les valeurs de production
nano .env
```

Contenu recommandé pour le fichier `.env`:

```
# Configuration de base
NODE_ENV=production
PORT=3002

# Sécurité
JWT_SECRET=votre-secret-jwt-très-sécurisé
JWT_EXPIRES_IN=24h

# URLs
FRONTEND_URL=https://votre-domaine.com
CORS_ORIGIN=https://votre-domaine.com

# Base de données (SQLite par défaut)
DATABASE_URL=file:/app/data/prod.db

# Limites de requêtes
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Étape 5 (Déploiement manuel): Créer les répertoires pour les certificats SSL

```bash
mkdir -p nginx/ssl
mkdir -p backups
```

### Étape 6 (Déploiement manuel): Déployer avec Docker Compose

```bash
# Construire et démarrer les conteneurs
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Configuration SSL

### Option 1: Certbot avec Let's Encrypt (Recommandé)

```bash
# Installer Certbot
apt install -y certbot

# Obtenir un certificat
certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com

# En cas d'échec avec www subdomain, essayer sans
if [ $? -ne 0 ]; then
    echo "Tentative d'obtention de certificat sans le sous-domaine www..."
    certbot certonly --standalone -d votre-domaine.com
fi

# Copier les certificats pour Nginx
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem nginx/ssl/key.pem

# Configurer le renouvellement automatique
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q && cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem /opt/gamr/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem /opt/gamr/nginx/ssl/key.pem && docker-compose -f /opt/gamr/docker-compose.prod.yml restart nginx" | sudo tee -a /etc/crontab > /dev/null
```

### Option 2: Certificat SSL de Hostinger

Si vous avez acheté un certificat SSL via Hostinger:

1. Téléchargez les fichiers de certificat depuis le panel Hostinger
2. Copiez-les dans le répertoire `nginx/ssl/`:
   ```bash
   cp chemin/vers/certificat.pem nginx/ssl/cert.pem
   cp chemin/vers/cle-privee.pem nginx/ssl/key.pem
   ```

### Étape 5: Redémarrer Nginx pour appliquer les certificats

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## 💾 Sauvegarde et Maintenance

### Configuration des sauvegardes automatiques

```bash
# Créer un script de sauvegarde
cat > /opt/gamr/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/gamr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /app/data/backup-$DATE.db"
docker cp gamr-platform:/app/data/backup-$DATE.db $BACKUP_DIR/

# Nettoyage des anciennes sauvegardes (garder les 7 dernières)
ls -tp $BACKUP_DIR/*.db | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}

# Log
echo "Sauvegarde effectuée le $(date)" >> $BACKUP_DIR/backup.log
EOF

# Rendre le script exécutable
chmod +x /opt/gamr/backup.sh

# Ajouter au crontab pour exécution quotidienne
echo "0 2 * * * root /opt/gamr/backup.sh" | tee -a /etc/crontab
```

### Mise à jour de l'application

```bash
cd /opt/gamr

# Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down

# Récupérer les dernières modifications
git pull origin master

# Reconstruire et redémarrer les conteneurs
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔧 Dépannage

### Vérification des logs

```bash
# Logs de l'application
docker logs gamr-platform

# Logs Nginx
docker logs gamr-nginx

# Logs en temps réel
docker logs -f gamr-platform
```

### Vérification de l'état des conteneurs

```bash
docker ps -a
docker-compose -f docker-compose.prod.yml ps
```

### Redémarrage des services

```bash
# Redémarrer tous les services
docker-compose -f docker-compose.prod.yml restart

# Redémarrer un service spécifique
docker-compose -f docker-compose.prod.yml restart gamr-app
```

### Vérification de la connectivité

```bash
# Vérifier le statut de l'application
curl -k https://localhost/health

# Vérifier la configuration Nginx
docker exec gamr-nginx nginx -t
```

## 📊 Monitoring

### Installation de Netdata (monitoring léger)

```bash
# Installer Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait

# Configurer le pare-feu pour le port Netdata
ufw allow 19999/tcp

# Accéder au dashboard via http://votre-ip-vps:19999
```

## 🔐 Sécurité Supplémentaire

### Fail2Ban pour protection SSH

```bash
# Installer Fail2Ban
apt install -y fail2ban

# Configurer pour SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOF

# Redémarrer Fail2Ban
systemctl restart fail2ban
```

### Audit de sécurité régulier

Exécutez régulièrement des audits de sécurité avec des outils comme Lynis:

```bash
# Installer Lynis
apt install -y lynis

# Exécuter un audit
lynis audit system
```

## 📝 Notes Importantes

- Assurez-vous que les ports 80 et 443 sont ouverts dans le pare-feu de Hostinger VPS
- Vérifiez régulièrement les mises à jour de sécurité du système
- Surveillez l'utilisation des ressources pour éviter les problèmes de performance
- Testez régulièrement le processus de restauration des sauvegardes


