# Script PowerShell pour déployer GAMRDIGITALE Platform sur un VPS Hostinger partagé
# Usage: .\deploy-to-hostinger-shared.ps1 -VpsIp <ip-vps> -Domain <domaine>

param (
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$SshUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$AppDir = "/opt/gamr"
)

$CurrentDir = Get-Location

Write-Host "🚀 Déploiement de GAMRDIGITALE Platform sur VPS Hostinger partagé" -ForegroundColor Cyan
Write-Host "------------------------------------------------"
Write-Host "IP du VPS: $VpsIp"
Write-Host "Domaine: $Domain"
Write-Host "Répertoire d'installation: $AppDir"
Write-Host "------------------------------------------------"

# Vérifier si SSH est disponible
try {
    ssh -V | Out-Null
}
catch {
    Write-Host "❌ Erreur: SSH n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    Write-Host "Veuillez installer OpenSSH ou Git Bash et réessayer." -ForegroundColor Red
    exit 1
}

# Vérifier la connectivité SSH
Write-Host "🔍 Vérification de la connectivité SSH..." -ForegroundColor Yellow
try {
    $sshTestOutput = ssh -o "BatchMode=yes" -o "ConnectTimeout=5" $SshUser@$VpsIp "echo SSH_CONNECTION_SUCCESSFUL" 2>&1
    if ($sshTestOutput -match "SSH_CONNECTION_SUCCESSFUL") {
        Write-Host "✅ Connexion SSH établie avec succès." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Impossible d'établir une connexion SSH automatique." -ForegroundColor Yellow
        Write-Host "Vous devrez peut-être entrer le mot de passe lors des prochaines étapes." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Impossible d'établir une connexion SSH automatique." -ForegroundColor Yellow
    Write-Host "Vous devrez peut-être entrer le mot de passe lors des prochaines étapes." -ForegroundColor Yellow
}

# Générer un JWT secret aléatoire
$JwtSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Vérifier si Docker est installé sur le serveur
Write-Host "🔍 Vérification de Docker sur le serveur..." -ForegroundColor Yellow
$dockerInstalled = ssh $SshUser@$VpsIp "command -v docker > /dev/null && echo yes || echo no"
if ($dockerInstalled -eq "no") {
    Write-Host "❌ Docker n'est pas installé sur le serveur. Installation requise." -ForegroundColor Red
    
    $installDocker = Read-Host "Voulez-vous installer Docker? (o/n)"
    if ($installDocker -ne "o") {
        Write-Host "❌ Déploiement annulé. Docker est requis pour continuer." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📋 Installation de Docker..." -ForegroundColor Yellow
    $sshCommand = @"
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
"@
    
    ssh $SshUser@$VpsIp $sshCommand
    Write-Host "✅ Docker installé avec succès" -ForegroundColor Green
}

Write-Host "📋 Étape 1: Préparation du répertoire d'application..." -ForegroundColor Yellow
$sshCommand = @"
# Créer le répertoire pour l'application
mkdir -p $AppDir
mkdir -p $AppDir/nginx/ssl
mkdir -p $AppDir/backups
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Répertoire d'application préparé" -ForegroundColor Green

Write-Host "📦 Étape 2: Déploiement des fichiers..." -ForegroundColor Yellow
# Créer une archive du projet
$tempFile = [System.IO.Path]::GetTempFileName() + ".tar.gz"
Write-Host "Création de l'archive du projet..."
git archive --format=tar.gz -o $tempFile HEAD

# Vérifier si l'archive a été créée avec succès
if (-not (Test-Path $tempFile)) {
    Write-Host "❌ Erreur: Impossible de créer l'archive du projet." -ForegroundColor Red
    Write-Host "Veuillez vérifier que vous êtes bien dans un dépôt Git valide." -ForegroundColor Red
    exit 1
}

# Transférer l'archive au serveur
Write-Host "Transfert de l'archive vers le serveur..."
scp $tempFile "$($SshUser)@$($VpsIp):$($AppDir)/gamr-deploy.tar.gz"

# Extraire l'archive sur le serveur
$sshCommand = @"
cd $AppDir
tar -xzf gamr-deploy.tar.gz
rm gamr-deploy.tar.gz

# Créer le fichier .env
cat > $AppDir/.env << EOT
# Configuration de base
NODE_ENV=production
PORT=3002

# Sécurité
JWT_SECRET=$JwtSecret
JWT_EXPIRES_IN=24h

# URLs
FRONTEND_URL=https://$Domain
CORS_ORIGIN=https://$Domain

# Base de données (SQLite par défaut)
DATABASE_URL=file:/app/data/prod.db

# Limites de requêtes
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOT
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Fichiers déployés" -ForegroundColor Green

Write-Host "🔧 Étape 3: Modification de la configuration Nginx..." -ForegroundColor Yellow
$sshCommand = @"
# Créer un fichier de configuration Nginx spécifique pour ce domaine
cat > $AppDir/nginx-$Domain.conf << 'EOT'
# Configuration Nginx pour GAMRDIGITALE Platform - $Domain
server {
    listen 80;
    server_name $Domain www.$Domain;
    
    # Redirection vers HTTPS
    location / {
        return 301 https://$Domain$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $Domain www.$Domain;

    # SSL configuration - sera configuré après obtention des certificats
    ssl_certificate /etc/letsencrypt/live/$Domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$Domain/privkey.pem;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOT

# Vérifier si le fichier de configuration existe déjà dans sites-available
if [ -f /etc/nginx/sites-available/$Domain ]; then
    echo "Le fichier de configuration Nginx pour $Domain existe déjà."
    echo "Sauvegarde de l'ancien fichier..."
    cp /etc/nginx/sites-available/$Domain /etc/nginx/sites-available/$Domain.bak.$(date +%Y%m%d%H%M%S)
fi

# Copier la configuration dans sites-available
cp $AppDir/nginx-$Domain.conf /etc/nginx/sites-available/$Domain

# Activer le site s'il n'est pas déjà activé
if [ ! -f /etc/nginx/sites-enabled/$Domain ]; then
    ln -s /etc/nginx/sites-available/$Domain /etc/nginx/sites-enabled/$Domain
fi

# Vérifier la configuration Nginx
nginx -t && echo "Configuration Nginx valide"
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Configuration Nginx modifiée" -ForegroundColor Green

Write-Host "🔒 Étape 4: Configuration SSL avec Let's Encrypt..." -ForegroundColor Yellow
$sshCommand = @"
# Installer Certbot si nécessaire
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Obtenir un certificat
certbot --nginx --agree-tos --non-interactive --email admin@$Domain -d $Domain -d www.$Domain

# En cas d'échec avec www subdomain, essayer sans
if [ $? -ne 0 ]; then
    echo "Tentative d'obtention de certificat sans le sous-domaine www..."
    certbot --nginx --agree-tos --non-interactive --email admin@$Domain -d $Domain
fi

# Recharger Nginx
systemctl reload nginx
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Certificats SSL configurés" -ForegroundColor Green

Write-Host "🐳 Étape 5: Déploiement avec Docker Compose..." -ForegroundColor Yellow
$sshCommand = @"
cd $AppDir

# Modifier le docker-compose.prod.yml pour éviter les conflits de ports
cat > docker-compose.shared.yml << EOT
version: '3.8'

services:
  gamr-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gamr-platform-$($Domain.Replace(".", "-"))
    restart: unless-stopped
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=file:/app/data/prod.db
      - JWT_SECRET=${JwtSecret}
      - JWT_EXPIRES_IN=24h
      - FRONTEND_URL=https://$Domain
      - CORS_ORIGIN=https://$Domain
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
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Application déployée" -ForegroundColor Green

Write-Host "💾 Étape 6: Configuration des sauvegardes..." -ForegroundColor Yellow
$sshCommand = @"
# Créer le script de sauvegarde
cat > $AppDir/backup.sh << EOT
#!/bin/bash
BACKUP_DIR="$AppDir/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Sauvegarde de la base de données
docker exec gamr-platform-$($Domain.Replace(".", "-")) sqlite3 /app/data/prod.db ".backup /app/data/backup-\$DATE.db"
docker cp gamr-platform-$($Domain.Replace(".", "-")):/app/data/backup-\$DATE.db \$BACKUP_DIR/

# Nettoyage des anciennes sauvegardes (garder les 7 dernières)
ls -tp \$BACKUP_DIR/*.db | grep -v '/\$' | tail -n +8 | xargs -I {} rm -- {}

# Log
echo "Sauvegarde effectuée le \$(date)" >> \$BACKUP_DIR/backup.log
EOT

# Rendre le script exécutable
chmod +x $AppDir/backup.sh

# Ajouter au crontab pour exécution quotidienne
(crontab -l 2>/dev/null || echo "") | grep -v "$AppDir/backup.sh" | { cat; echo "0 2 * * * $AppDir/backup.sh"; } | crontab -
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Sauvegardes configurées" -ForegroundColor Green

# Vérifier que l'application est en cours d'exécution
Write-Host "🔍 Vérification de l'application..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "docker ps | grep gamr-platform-$($Domain.Replace(".", "-"))"

# Nettoyage local
Remove-Item -Path $tempFile -Force

Write-Host "------------------------------------------------"
Write-Host "🎉 Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "------------------------------------------------"
Write-Host "📝 Informations importantes:" -ForegroundColor Cyan
Write-Host "- URL de l'application: https://$Domain"
Write-Host "- Conteneur Docker: gamr-platform-$($Domain.Replace(".", "-"))"
Write-Host "- Emplacement des backups: $AppDir/backups"
Write-Host "- Logs: docker logs gamr-platform-$($Domain.Replace(".", "-"))"
Write-Host "------------------------------------------------"
Write-Host "Pour vous connecter au serveur: ssh $SshUser@$VpsIp"
Write-Host "Pour plus d'informations, consultez le fichier HOSTINGER_DEPLOYMENT.md"
Write-Host "------------------------------------------------"
