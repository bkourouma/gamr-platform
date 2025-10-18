# Script PowerShell pour vérifier le statut du déploiement GAMR sur Hostinger VPS
# Usage: .\check-hostinger-deployment.ps1 -VpsIp <ip-vps> -Domain <domaine>

param (
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SshUser = "root"
)

$AppDir = "/opt/gamr"

Write-Host "🔍 Vérification du déploiement GAMR Platform sur VPS Hostinger" -ForegroundColor Cyan
Write-Host "------------------------------------------------"
Write-Host "IP du VPS: $VpsIp"
if ($Domain) { Write-Host "Domaine: $Domain" }
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

# Vérifier l'état des conteneurs Docker
Write-Host "📊 Vérification des conteneurs Docker..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "docker ps -a" | Out-Host

# Vérifier les logs récents
Write-Host "📜 Logs récents de l'application..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "docker logs --tail 20 gamr-platform 2>&1" | Out-Host

# Vérifier l'utilisation des ressources
Write-Host "💻 Utilisation des ressources..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "docker stats --no-stream gamr-platform" | Out-Host

# Vérifier l'état de santé de l'application
Write-Host "🩺 Vérification de l'état de santé de l'application..." -ForegroundColor Yellow
if ($Domain) {
    try {
        $healthResponse = Invoke-WebRequest -Uri "https://$Domain/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "✅ L'application est en ligne et répond correctement." -ForegroundColor Green
        } else {
            Write-Host "⚠️ L'application répond avec le code: $($healthResponse.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Impossible d'accéder à l'application via le domaine: $Domain" -ForegroundColor Red
        Write-Host "Erreur: $_" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ Aucun domaine spécifié. Vérification de santé via domaine ignorée." -ForegroundColor Blue
}

# Vérifier les sauvegardes
Write-Host "💾 Vérification des sauvegardes..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "ls -la $AppDir/backups/" | Out-Host

# Vérifier les certificats SSL
if ($Domain) {
    Write-Host "🔒 Vérification des certificats SSL..." -ForegroundColor Yellow
    ssh $SshUser@$VpsIp "certbot certificates | grep -A 2 $Domain" | Out-Host
}

# Vérifier l'état du pare-feu
Write-Host "🛡️ État du pare-feu..." -ForegroundColor Yellow
ssh $SshUser@$VpsIp "ufw status" | Out-Host

Write-Host "------------------------------------------------"
Write-Host "🎯 Actions recommandées:" -ForegroundColor Cyan
Write-Host "------------------------------------------------"
Write-Host "1. Pour redémarrer l'application:"
Write-Host "   ssh $SshUser@$VpsIp 'cd $AppDir && docker-compose -f docker-compose.prod.yml restart'"
Write-Host ""
Write-Host "2. Pour mettre à jour l'application:"
Write-Host "   ssh $SshUser@$VpsIp 'cd $AppDir && git pull && docker-compose -f docker-compose.prod.yml up -d --build'"
Write-Host ""
Write-Host "3. Pour forcer une sauvegarde de la base de données:"
Write-Host "   ssh $SshUser@$VpsIp '$AppDir/backup.sh'"
Write-Host ""
Write-Host "4. Pour voir les logs en temps réel:"
Write-Host "   ssh $SshUser@$VpsIp 'docker logs -f gamr-platform'"
Write-Host "------------------------------------------------"
