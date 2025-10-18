# Script PowerShell pour déployer GAMR Platform sur VPS Hostinger
# Usage: .\deploy-to-hostinger.ps1 -VpsIp <ip-vps> -Domain <domaine>

param (
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$SshUser = "root"
)

$AppDir = "/opt/gamr"
$CurrentDir = Get-Location

Write-Host "🚀 Déploiement de GAMR Platform sur VPS Hostinger" -ForegroundColor Cyan
Write-Host "------------------------------------------------"
Write-Host "IP du VPS: $VpsIp"
Write-Host "Domaine: $Domain"
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

# Générer un JWT secret aléatoire
$JwtSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

Write-Host "📋 Étape 1: Préparation du serveur distant..." -ForegroundColor Yellow
$sshCommand = @"
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
mkdir -p $AppDir
mkdir -p $AppDir/nginx/ssl
mkdir -p $AppDir/backups
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Configuration du serveur terminée" -ForegroundColor Green

Write-Host "📦 Étape 2: Déploiement des fichiers..." -ForegroundColor Yellow
# Créer une archive du projet
$tempFile = [System.IO.Path]::GetTempFileName() + ".tar.gz"
Write-Host "Création de l'archive du projet..."
git archive --format=tar.gz -o $tempFile HEAD

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

Write-Host "🔒 Étape 3: Configuration SSL avec Let's Encrypt..." -ForegroundColor Yellow
$sshCommand = @"
# Installer Certbot
apt install -y certbot

# Arrêter temporairement les services qui pourraient utiliser le port 80
docker-compose -f $AppDir/docker-compose.prod.yml down 2>/dev/null || true

# Obtenir un certificat
certbot certonly --standalone --agree-tos --non-interactive --email admin@$Domain -d $Domain -d www.$Domain

# Copier les certificats pour Nginx
cp /etc/letsencrypt/live/$Domain/fullchain.pem $AppDir/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$Domain/privkey.pem $AppDir/nginx/ssl/key.pem

# Configurer le renouvellement automatique
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q && cp /etc/letsencrypt/live/$Domain/fullchain.pem $AppDir/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/$Domain/privkey.pem $AppDir/nginx/ssl/key.pem && docker-compose -f $AppDir/docker-compose.prod.yml restart nginx" | tee -a /etc/crontab > /dev/null
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Certificats SSL configurés" -ForegroundColor Green

Write-Host "🐳 Étape 4: Déploiement avec Docker Compose..." -ForegroundColor Yellow
$sshCommand = @"
cd $AppDir
docker-compose -f docker-compose.prod.yml up -d
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Application déployée" -ForegroundColor Green

Write-Host "💾 Étape 5: Configuration des sauvegardes..." -ForegroundColor Yellow
$sshCommand = @"
# Créer le script de sauvegarde
cat > $AppDir/backup.sh << 'EOT'
#!/bin/bash
BACKUP_DIR="$AppDir/backups"
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
chmod +x $AppDir/backup.sh

# Ajouter au crontab pour exécution quotidienne
echo "0 2 * * * root $AppDir/backup.sh" | tee -a /etc/crontab
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Sauvegardes configurées" -ForegroundColor Green

Write-Host "📊 Étape 6: Installation de Netdata pour le monitoring..." -ForegroundColor Yellow
$sshCommand = @"
# Installer Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait

# Configurer le pare-feu pour le port Netdata
ufw allow 19999/tcp
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Monitoring configuré" -ForegroundColor Green

Write-Host "🔐 Étape 7: Configuration de la sécurité supplémentaire..." -ForegroundColor Yellow
$sshCommand = @"
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
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Sécurité configurée" -ForegroundColor Green

# Vérifier que l'application est en cours d'exécution
Write-Host "🔍 Vérification de l'application..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "docker ps | grep gamr-platform"

# Nettoyage local
Remove-Item -Path $tempFile -Force

Write-Host "------------------------------------------------"
Write-Host "🎉 Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "------------------------------------------------"
Write-Host "📝 Informations importantes:" -ForegroundColor Cyan
Write-Host "- URL de l'application: https://$Domain"
Write-Host "- URL du monitoring: http://$VpsIp:19999"
Write-Host "- Emplacement des backups: $AppDir/backups"
Write-Host "- Logs: docker logs gamr-platform"
Write-Host "------------------------------------------------"
Write-Host "Pour vous connecter au serveur: ssh $SshUser@$VpsIp"
Write-Host "Pour plus d'informations, consultez le fichier HOSTINGER_DEPLOYMENT.md"
Write-Host "------------------------------------------------"
