# Script PowerShell pour déployer GAMR Platform avec remplacement de la base de données
# Usage: .\deploy-with-db.ps1 -VpsIp <ip-vps> -Domain <domaine>

param (
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$SshUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$LocalDbPath = "prisma\dev.db",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipCommit = $false
)

$AppDir = "/opt/gamr"
$CurrentDir = Get-Location

Write-Host "🚀 Déploiement de GAMR Platform avec remplacement de la base de données" -ForegroundColor Cyan
Write-Host "========================================================================"
Write-Host "IP du VPS: $VpsIp"
Write-Host "Domaine: $Domain"
Write-Host "Base de données locale: $LocalDbPath"
Write-Host "========================================================================"

# Vérifier que la base de données locale existe
if (-not (Test-Path $LocalDbPath)) {
    Write-Host "❌ Erreur: La base de données locale '$LocalDbPath' est introuvable." -ForegroundColor Red
    Write-Host "Veuillez vérifier le chemin et réessayer." -ForegroundColor Red
    exit 1
}

$dbSize = (Get-Item $LocalDbPath).Length
Write-Host "✅ Base de données locale trouvée (Taille: $([math]::Round($dbSize/1KB, 2)) KB)" -ForegroundColor Green

# Étape 1: Commit et push (si non ignoré)
if (-not $SkipCommit) {
    Write-Host ""
    Write-Host "📝 Étape 1: Vérification des modifications Git..." -ForegroundColor Yellow
    $gitStatus = git status --short
    if ($gitStatus) {
        Write-Host "Modifications détectées:" -ForegroundColor Yellow
        git status --short
        
        $response = Read-Host "Voulez-vous committer et pousser ces modifications? (O/N)"
        if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
            $commitMessage = Read-Host "Entrez le message de commit"
            if ([string]::IsNullOrWhiteSpace($commitMessage)) {
                $commitMessage = "Deployment: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            }
            
            Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
            git add .
            
            Write-Host "Création du commit..." -ForegroundColor Yellow
            git commit -m $commitMessage
            
            Write-Host "Envoi vers le repository..." -ForegroundColor Yellow
            git push
            Write-Host "✅ Modifications poussées vers Git" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Déploiement continué sans commit" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Aucune modification à committer" -ForegroundColor Green
    }
}

# Vérifier SSH
Write-Host ""
Write-Host "🔍 Vérification de la connectivité SSH..." -ForegroundColor Yellow
try {
    $sshTestOutput = ssh -o "BatchMode=yes" -o "ConnectTimeout=5" $SshUser@$VpsIp "echo SSH_CONNECTION_SUCCESSFUL" 2>&1
    if ($sshTestOutput -match "SSH_CONNECTION_SUCCESSFUL") {
        Write-Host "✅ Connexion SSH établie" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connexion SSH nécessitera un mot de passe" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de vérifier SSH automatiquement" -ForegroundColor Yellow
}

# Étape 2: Créer une sauvegarde de la base de données actuelle
Write-Host ""
Write-Host "💾 Étape 2: Création d'une sauvegarde de la base de données production..." -ForegroundColor Yellow
$sshCommand = @"
cd $AppDir
mkdir -p backups

# Vérifier si le conteneur est en cours d'exécution et sauvegarder
if docker ps | grep -q gamr-platform; then
    echo "Sauvegarde depuis le conteneur actif..."
    DATE=\$(date +%Y%m%d_%H%M%S)
    docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /tmp/prod-backup-\$DATE.db" 2>/dev/null || echo "Erreur lors de la sauvegarde depuis le conteneur"
    docker cp gamr-platform:/tmp/prod-backup-\$DATE.db backups/ 2>/dev/null || echo "Erreur lors de la copie de la sauvegarde"
else
    echo "Conteneur arrêté, sauvegarde depuis le volume Docker..."
    DATE=\$(date +%Y%m%d_%H%M%S)
    docker run --rm -v gamr-platform_gamr-data:/data -v $AppDir/backups:/backup alpine sh -c "
        if [ -f /data/prod.db ]; then
            cp /data/prod.db /backup/prod-backup-\$DATE.db && echo 'Sauvegarde créée: prod-backup-\$DATE.db'
        else
            echo 'Aucune base de données existante à sauvegarder'
        fi
    " 2>/dev/null || echo "Volume non trouvé ou erreur"
fi

echo "✅ Sauvegarde terminée"
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Sauvegarde créée" -ForegroundColor Green

# Étape 3: Arrêter les conteneurs
Write-Host ""
Write-Host "🛑 Étape 3: Arrêt des conteneurs..." -ForegroundColor Yellow
$sshCommand = @"
cd $AppDir
docker-compose -f docker-compose.prod.yml down
echo "✅ Conteneurs arrêtés"
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Conteneurs arrêtés" -ForegroundColor Green

# Étape 4: Déployer le nouveau code
Write-Host ""
Write-Host "📦 Étape 4: Déploiement du code..." -ForegroundColor Yellow

# Créer une archive du projet
$tempFile = [System.IO.Path]::GetTempFileName() + ".tar.gz"
Write-Host "Création de l'archive du projet..."
git archive --format=tar.gz -o $tempFile HEAD

if (-not (Test-Path $tempFile)) {
    Write-Host "❌ Erreur: Impossible de créer l'archive." -ForegroundColor Red
    exit 1
}

# Transférer l'archive
Write-Host "Transfert de l'archive vers le serveur..."
scp $tempFile "$($SshUser)@$($VpsIp):$($AppDir)/gamr-deploy.tar.gz"

# Extraire sur le serveur
$sshCommand = @"
cd $AppDir

# Sauvegarder les fichiers importants
if [ -f .env ]; then cp .env .env.backup; fi
if [ -d nginx/ssl ]; then cp -r nginx/ssl nginx/ssl.backup; fi

# Extraire la nouvelle version
tar -xzf gamr-deploy.tar.gz

# Restaurer les fichiers importants
if [ -f .env.backup ]; then mv .env.backup .env; fi
if [ -d nginx/ssl.backup ]; then rm -rf nginx/ssl && mv nginx/ssl.backup nginx/ssl; fi

# Nettoyer
rm -f gamr-deploy.tar.gz

echo "✅ Code déployé"
"@

ssh $SshUser@$VpsIp $sshCommand
Remove-Item -Path $tempFile -Force
Write-Host "✅ Code déployé" -ForegroundColor Green

# Étape 5: Transférer et remplacer la base de données
Write-Host ""
Write-Host "🗄️  Étape 5: Transfert et remplacement de la base de données..." -ForegroundColor Yellow

# Transférer la base de données locale
Write-Host "Transfert de la base de données locale vers le serveur..."
$tempDbPath = $LocalDbPath -replace "\\", "/"
scp $LocalDbPath "$($SshUser)@$($VpsIp):/tmp/dev.db"

# Remplacer dans le volume Docker
Write-Host "Remplacement de la base de données dans le volume Docker..."
$sshCommand = @"
# Copier la nouvelle base de données dans le volume
docker run --rm -v gamr-platform_gamr-data:/data -v /tmp:/tmp alpine sh -c "
    # Supprimer l'ancienne base de données si elle existe
    rm -f /data/prod.db
    
    # Copier la nouvelle base de données
    cp /tmp/dev.db /data/prod.db
    
    # Ajuster les permissions
    chmod 644 /data/prod.db
    
    # Vérifier
    if [ -f /data/prod.db ]; then
        ls -lh /data/prod.db
        echo '✅ Base de données remplacée avec succès'
    else
        echo '❌ Erreur: La base de données n a pas été copiée'
        exit 1
    fi
"

# Nettoyer le fichier temporaire
rm -f /tmp/dev.db

echo "✅ Base de données remplacée"
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Base de données remplacée" -ForegroundColor Green

# Étape 6: Reconstruire et redémarrer
Write-Host ""
Write-Host "🐳 Étape 6: Reconstruction et redémarrage des conteneurs..." -ForegroundColor Yellow
$sshCommand = @"
cd $AppDir
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
echo "✅ Conteneurs redémarrés"
"@

ssh $SshUser@$VpsIp $sshCommand
Write-Host "✅ Conteneurs redémarrés" -ForegroundColor Green

# Étape 7: Vérification
Write-Host ""
Write-Host "🔍 Étape 7: Vérification..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$sshCommand = @"
echo "=== État des conteneurs ==="
docker ps | grep -E 'CONTAINER|gamr'

echo ""
echo "=== Vérification de la base de données ==="
docker run --rm -v gamr-platform_gamr-data:/data alpine sh -c "
    if [ -f /data/prod.db ]; then
        ls -lh /data/prod.db
        echo '✅ Base de données présente'
    else
        echo '❌ Base de données absente'
    fi
"

echo ""
echo "=== Dernières lignes des logs ==="
docker logs --tail 20 gamr-platform 2>&1 | tail -10
"@

ssh $SshUser@$VpsIp $sshCommand

Write-Host ""
Write-Host "========================================================================"
Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green
Write-Host "========================================================================"
Write-Host "📝 Informations:" -ForegroundColor Cyan
Write-Host "- URL de l'application: https://$Domain"
Write-Host "- Base de données remplacée depuis: $LocalDbPath"
Write-Host "- Sauvegarde précédente dans: $AppDir/backups"
Write-Host ""
Write-Host "📊 Commandes utiles:" -ForegroundColor Cyan
Write-Host "- Voir les logs: ssh $SshUser@$VpsIp 'docker logs -f gamr-platform'"
Write-Host "- Vérifier l'état: ssh $SshUser@$VpsIp 'docker ps'"
Write-Host "- Tester l'API: curl https://$Domain/health"
Write-Host "========================================================================"

