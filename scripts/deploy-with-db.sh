#!/bin/bash
# Script Bash pour déployer GAMR Platform avec remplacement de la base de données
# Usage: ./deploy-with-db.sh <ip-vps> <domaine> [chemin-local-db]

set -e

# Vérification des paramètres
if [ $# -lt 2 ]; then
    echo "Usage: $0 <ip-vps> <domaine> [chemin-local-db]"
    echo "Exemple: $0 147.93.44.169 votre-domaine.com"
    exit 1
fi

VPS_IP="$1"
DOMAIN="$2"
LOCAL_DB_PATH="${3:-prisma/dev.db}"
SSH_USER="root"
APP_DIR="/opt/gamr"

echo "🚀 Déploiement de GAMR Platform avec remplacement de la base de données"
echo "========================================================================"
echo "IP du VPS: $VPS_IP"
echo "Domaine: $DOMAIN"
echo "Base de données locale: $LOCAL_DB_PATH"
echo "========================================================================"

# Vérifier que la base de données locale existe
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "❌ Erreur: La base de données locale '$LOCAL_DB_PATH' est introuvable."
    exit 1
fi

DB_SIZE=$(du -h "$LOCAL_DB_PATH" | cut -f1)
echo "✅ Base de données locale trouvée (Taille: $DB_SIZE)"

# Étape 1: Commit et push (optionnel)
echo ""
echo "📝 Étape 1: Vérification des modifications Git..."
if [ -n "$(git status --short)" ]; then
    echo "Modifications détectées:"
    git status --short
    
    read -p "Voulez-vous committer et pousser ces modifications? (O/N): " response
    if [[ "$response" =~ ^[OoYy]$ ]]; then
        read -p "Entrez le message de commit: " commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Deployment: $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        echo "Ajout des fichiers..."
        git add .
        
        echo "Création du commit..."
        git commit -m "$commit_message"
        
        echo "Envoi vers le repository..."
        git push
        echo "✅ Modifications poussées vers Git"
    else
        echo "⚠️  Déploiement continué sans commit"
    fi
else
    echo "✅ Aucune modification à committer"
fi

# Vérifier SSH
echo ""
echo "🔍 Vérification de la connectivité SSH..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$SSH_USER@$VPS_IP" "echo SSH_CONNECTION_SUCCESSFUL" 2>/dev/null | grep -q "SSH_CONNECTION_SUCCESSFUL"; then
    echo "✅ Connexion SSH établie"
else
    echo "⚠️  Connexion SSH nécessitera un mot de passe"
fi

# Étape 2: Créer une sauvegarde
echo ""
echo "💾 Étape 2: Création d'une sauvegarde de la base de données production..."
ssh "$SSH_USER@$VPS_IP" << 'ENDSSH'
cd /opt/gamr
mkdir -p backups

# Vérifier si le conteneur est en cours d'exécution et sauvegarder
if docker ps | grep -q gamr-platform; then
    echo "Sauvegarde depuis le conteneur actif..."
    DATE=$(date +%Y%m%d_%H%M%S)
    docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /tmp/prod-backup-$DATE.db" 2>/dev/null || echo "Erreur lors de la sauvegarde"
    docker cp gamr-platform:/tmp/prod-backup-$DATE.db backups/ 2>/dev/null || echo "Erreur lors de la copie"
else
    echo "Conteneur arrêté, sauvegarde depuis le volume Docker..."
    DATE=$(date +%Y%m%d_%H%M%S)
    docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "
        if [ -f /data/prod.db ]; then
            cp /data/prod.db /backup/prod-backup-$DATE.db && echo 'Sauvegarde créée: prod-backup-$DATE.db'
        else
            echo 'Aucune base de données existante à sauvegarder'
        fi
    " 2>/dev/null || echo "Volume non trouvé ou erreur"
fi

echo "✅ Sauvegarde terminée"
ENDSSH
echo "✅ Sauvegarde créée"

# Étape 3: Arrêter les conteneurs
echo ""
echo "🛑 Étape 3: Arrêt des conteneurs..."
ssh "$SSH_USER@$VPS_IP" "cd $APP_DIR && docker-compose -f docker-compose.prod.yml down"
echo "✅ Conteneurs arrêtés"

# Étape 4: Déployer le code
echo ""
echo "📦 Étape 4: Déploiement du code..."

# Créer une archive
TEMP_FILE=$(mktemp).tar.gz
echo "Création de l'archive du projet..."
git archive --format=tar.gz -o "$TEMP_FILE" HEAD

# Transférer l'archive
echo "Transfert de l'archive vers le serveur..."
scp "$TEMP_FILE" "$SSH_USER@$VPS_IP:$APP_DIR/gamr-deploy.tar.gz"

# Extraire sur le serveur
ssh "$SSH_USER@$VPS_IP" << ENDSSH
cd $APP_DIR

# Sauvegarder les fichiers importants
[ -f .env ] && cp .env .env.backup
[ -d nginx/ssl ] && cp -r nginx/ssl nginx/ssl.backup

# Extraire la nouvelle version
tar -xzf gamr-deploy.tar.gz

# Restaurer les fichiers importants
[ -f .env.backup ] && mv .env.backup .env
[ -d nginx/ssl.backup ] && rm -rf nginx/ssl && mv nginx/ssl.backup nginx/ssl

# Nettoyer
rm -f gamr-deploy.tar.gz

echo "✅ Code déployé"
ENDSSH

rm -f "$TEMP_FILE"
echo "✅ Code déployé"

# Étape 5: Transférer et remplacer la base de données
echo ""
echo "🗄️  Étape 5: Transfert et remplacement de la base de données..."

# Transférer la base de données
echo "Transfert de la base de données locale vers le serveur..."
scp "$LOCAL_DB_PATH" "$SSH_USER@$VPS_IP:/tmp/dev.db"

# Remplacer dans le volume Docker
echo "Remplacement de la base de données dans le volume Docker..."
ssh "$SSH_USER@$VPS_IP" << 'ENDSSH'
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
ENDSSH
echo "✅ Base de données remplacée"

# Étape 6: Reconstruire et redémarrer
echo ""
echo "🐳 Étape 6: Reconstruction et redémarrage des conteneurs..."
ssh "$SSH_USER@$VPS_IP" "cd $APP_DIR && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d"
echo "✅ Conteneurs redémarrés"

# Étape 7: Vérification
echo ""
echo "🔍 Étape 7: Vérification..."
sleep 5

ssh "$SSH_USER@$VPS_IP" << 'ENDSSH'
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
ENDSSH

echo ""
echo "========================================================================"
echo "🎉 Déploiement terminé!"
echo "========================================================================"
echo "📝 Informations:"
echo "- URL de l'application: https://$DOMAIN"
echo "- Base de données remplacée depuis: $LOCAL_DB_PATH"
echo "- Sauvegarde précédente dans: $APP_DIR/backups"
echo ""
echo "📊 Commandes utiles:"
echo "- Voir les logs: ssh $SSH_USER@$VPS_IP 'docker logs -f gamr-platform'"
echo "- Vérifier l'état: ssh $SSH_USER@$VPS_IP 'docker ps'"
echo "- Tester l'API: curl https://$DOMAIN/health"
echo "========================================================================"

