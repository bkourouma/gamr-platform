# 🚀 Guide de Déploiement avec Remplacement de Base de Données

Ce guide détaille les étapes complètes pour déployer vos changements locaux et remplacer la base de données du serveur par celle de votre environnement de développement.

## 📋 Vue d'ensemble

**Objectif:** Déployer le code modifié + remplacer `prod.db` sur le serveur par `dev.db` local

**Chemin local DB:** `prisma/dev.db`  
**Chemin production DB:** Volume Docker `gamr-data` → `/app/data/prod.db`

---

## 🔍 Étape 1: Vérifier l'état actuel

### 1.1 Vérifier vos modifications locales

```bash
# Voir les fichiers modifiés
git status

# Voir les différences
git diff
```

### 1.2 Vérifier que votre base de données locale existe

```bash
# Windows PowerShell
Test-Path prisma\dev.db

# Linux/Mac
ls -lh prisma/dev.db
```

### 1.3 Vérifier .gitignore (déjà configuré correctement)

Le fichier `.gitignore` ignore déjà les fichiers de base de données :
- `data/`
- `prisma/*.db`

**Aucune modification nécessaire** - la base de données ne sera pas commitée dans Git.

---

## 📝 Étape 2: Committer vos changements

### 2.1 Ajouter les fichiers modifiés

```bash
# Voir ce qui sera commité
git status

# Ajouter tous les fichiers modifiés
git add .

# OU ajouter des fichiers spécifiques
git add src/
git add prisma/schema.prisma
# ... etc
```

### 2.2 Créer un commit

```bash
git commit -m "Description de vos changements"
```

**Exemples de messages:**
```bash
git commit -m "Ajout nouvelles fonctionnalités GAMR"
git commit -m "Mise à jour du schéma de base de données"
git commit -m "Corrections de bugs et améliorations UI"
```

### 2.3 Pousser vers le repository

```bash
# Si c'est votre première fois sur cette branche
git push -u origin main

# OU si la branche existe déjà
git push origin main
```

**Note:** Remplacez `main` par le nom de votre branche si différent (`master`, `develop`, etc.)

---

## 🔄 Étape 3: Préparer la base de données locale

### 3.1 S'assurer que la base de données est à jour

```bash
# Générer le client Prisma (si le schéma a changé)
npx prisma generate

# Appliquer les migrations (si nécessaire)
npx prisma db push
```

### 3.2 Vérifier la taille de la base de données

```bash
# Windows PowerShell
(Get-Item prisma\dev.db).Length

# Linux/Mac
ls -lh prisma/dev.db
```

**Important:** Notez la taille - elle doit être > 0 bytes.

---

## 🚀 Étape 4: Déployer avec remplacement de la base de données

### Option A: Script PowerShell automatique (Windows)

Utilisez le script `deploy-with-db.ps1` :

```powershell
.\scripts\deploy-with-db.ps1 -VpsIp "147.93.44.169" -Domain "votre-domaine.com"
```

### Option B: Script Bash automatique (Linux/Mac)

```bash
chmod +x scripts/deploy-with-db.sh
./scripts/deploy-with-db.sh 147.93.44.169 votre-domaine.com
```

### Option C: Déploiement manuel (toutes les commandes)

Suivez les étapes ci-dessous pour un déploiement manuel complet.

---

## 📦 Étape 5: Déploiement manuel - Commandes complètes

### 5.1 Se connecter au serveur

```bash
ssh root@147.93.44.169
# Entrer le mot de passe si demandé: Password@Acc225
```

### 5.2 Arrêter les conteneurs (SANS supprimer les volumes)

```bash
cd /opt/gamr
docker-compose -f docker-compose.prod.yml down
```

**Important:** Utilisez `down` sans l'option `-v` pour préserver les volumes.

### 5.3 Créer une sauvegarde de la base de données actuelle

```bash
# Créer le répertoire de sauvegarde si inexistant
mkdir -p /opt/gamr/backups

# Vérifier si le conteneur existe encore
if docker ps -a | grep -q gamr-platform; then
    # Sauvegarder depuis le conteneur existant
    docker exec gamr-platform sqlite3 /app/data/prod.db ".backup /tmp/prod-backup-$(date +%Y%m%d_%H%M%S).db"
    docker cp gamr-platform:/tmp/prod-backup-*.db /opt/gamr/backups/
else
    # Ou depuis le volume Docker directement
    docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "cp /data/prod.db /backup/prod-backup-$(date +%Y%m%d_%H%M%S).db"
fi
```

### 5.4 Déployer le nouveau code

**Sur votre machine locale:**

```bash
# Créer une archive du projet
git archive --format=tar.gz -o deploy.tar.gz HEAD

# Transférer l'archive au serveur
scp deploy.tar.gz root@147.93.44.169:/opt/gamr/

# Nettoyer l'archive locale
rm deploy.tar.gz
```

**Sur le serveur:**

```bash
cd /opt/gamr

# Sauvegarder les fichiers importants (.env, SSL, etc.)
cp .env .env.backup
cp -r nginx/ssl nginx/ssl.backup

# Extraire la nouvelle version
tar -xzf deploy.tar.gz

# Restaurer les fichiers importants
mv .env.backup .env
rm -rf nginx/ssl
mv nginx/ssl.backup nginx/ssl

# Nettoyer
rm deploy.tar.gz
```

### 5.5 Transférer la base de données locale vers le serveur

**Sur votre machine locale:**

```bash
# Transférer la base de données
scp prisma/dev.db root@147.93.44.169:/tmp/dev.db
```

### 5.6 Remplacer la base de données dans le volume Docker

**Sur le serveur:**

```bash
# Option 1: Si le volume existe déjà mais le conteneur est arrêté
# Créer un conteneur temporaire pour accéder au volume
docker run --rm -v gamr-platform_gamr-data:/data -v /tmp:/tmp alpine sh -c "
    # Supprimer l'ancienne base de données
    rm -f /data/prod.db
    
    # Copier la nouvelle base de données
    cp /tmp/dev.db /data/prod.db
    
    # Ajuster les permissions
    chmod 644 /data/prod.db
"

# Vérifier que le fichier a été copié
docker run --rm -v gamr-platform_gamr-data:/data alpine ls -lh /data/
```

### 5.7 Reconstruire et redémarrer les conteneurs

```bash
cd /opt/gamr

# Reconstruire l'image (si nécessaire)
docker-compose -f docker-compose.prod.yml build

# Démarrer les conteneurs
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker logs -f gamr-platform
```

**Note:** Les migrations Prisma s'exécuteront automatiquement au démarrage via `start.sh`, mais comme vous avez déjà remplacé la base de données, assurez-vous que le schéma est compatible.

---

## ✅ Étape 6: Vérification

### 6.1 Vérifier que les conteneurs sont en cours d'exécution

```bash
docker ps
```

Vous devriez voir:
- `gamr-platform`
- `gamr-nginx`

### 6.2 Vérifier les logs

```bash
# Logs de l'application
docker logs gamr-platform

# Logs en temps réel
docker logs -f gamr-platform
```

### 6.3 Vérifier que la base de données a été remplacée

```bash
# Se connecter au conteneur
docker exec -it gamr-platform sh

# Vérifier la taille et la date de la base de données
ls -lh /app/data/prod.db

# Vérifier quelques données (optionnel)
sqlite3 /app/data/prod.db "SELECT COUNT(*) FROM tenants;"
sqlite3 /app/data/prod.db "SELECT COUNT(*) FROM users;"
exit
```

### 6.4 Tester l'application

```bash
# Test de santé
curl https://votre-domaine.com/health

# OU depuis le serveur
curl http://localhost:3002/health
```

---

## 🔧 Étape 7: Gestion des problèmes

### Problème: Le conteneur ne démarre pas

```bash
# Voir les logs d'erreur
docker logs gamr-platform

# Vérifier les permissions de la base de données
docker exec -it gamr-platform ls -la /app/data/

# Corriger les permissions si nécessaire
docker run --rm -v gamr-platform_gamr-data:/data alpine chmod 644 /data/prod.db
```

### Problème: Erreurs de migrations Prisma

Si les migrations échouent car le schéma est différent:

```bash
# Option 1: Forcer le schéma (ATTENTION: peut supprimer des données)
docker exec -it gamr-platform npx prisma db push --force-reset

# Option 2: Appliquer uniquement les migrations manquantes
docker exec -it gamr-platform npx prisma migrate deploy
```

### Problème: Restaurer la base de données précédente

```bash
# Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down

# Restaurer depuis la sauvegarde
docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "
    rm -f /data/prod.db
    cp /backup/prod-backup-YYYYMMDD_HHMMSS.db /data/prod.db
    chmod 644 /data/prod.db
"

# Redémarrer
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Résumé des commandes essentielles

### Sur votre machine locale:

```bash
# 1. Committer et pousser
git add .
git commit -m "Vos changements"
git push origin main

# 2. Transférer le code
git archive --format=tar.gz -o deploy.tar.gz HEAD
scp deploy.tar.gz root@147.93.44.169:/opt/gamr/

# 3. Transférer la base de données
scp prisma/dev.db root@147.93.44.169:/tmp/dev.db
```

### Sur le serveur (SSH):

```bash
# 1. Arrêter les conteneurs
cd /opt/gamr && docker-compose -f docker-compose.prod.yml down

# 2. Sauvegarder l'ancienne DB
docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "cp /data/prod.db /backup/prod-backup-$(date +%Y%m%d_%H%M%S).db"

# 3. Déployer le code
cd /opt/gamr && tar -xzf deploy.tar.gz && rm deploy.tar.gz

# 4. Remplacer la DB
docker run --rm -v gamr-platform_gamr-data:/data -v /tmp:/tmp alpine sh -c "rm -f /data/prod.db && cp /tmp/dev.db /data/prod.db && chmod 644 /data/prod.db"

# 5. Redémarrer
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Vérifier
docker logs -f gamr-platform
```

---

## 🎯 Checklist de déploiement

- [ ] Modifications locales testées et fonctionnelles
- [ ] Base de données locale vérifiée (`prisma/dev.db` existe et est valide)
- [ ] Changements commités dans Git
- [ ] Changements poussés vers le repository
- [ ] Sauvegarde de la base de données production créée
- [ ] Code déployé sur le serveur
- [ ] Base de données locale transférée sur le serveur
- [ ] Base de données remplacée dans le volume Docker
- [ ] Conteneurs redémarrés avec succès
- [ ] Application accessible et fonctionnelle
- [ ] Vérification des données dans la nouvelle base

---

## 📝 Notes importantes

1. **Sauvegarde toujours:** Toujours créer une sauvegarde avant de remplacer la base de données en production.

2. **Compatibilité du schéma:** Assurez-vous que le schéma Prisma local est compatible avec la production. Si vous avez modifié le schéma, les migrations s'appliqueront au démarrage.

3. **Temps d'arrêt:** Il y aura un court temps d'arrêt pendant le remplacement de la base de données (généralement 1-2 minutes).

4. **Permissions:** Le conteneur s'exécute en tant qu'utilisateur non-root (`gamr`), assurez-vous que la base de données a les bonnes permissions (644).

5. **Taille de la base:** Si votre base de données locale est très volumineuse, le transfert peut prendre du temps. Surveillez la progression avec `scp -v`.

---

## 🆘 Support

En cas de problème:
1. Vérifiez les logs: `docker logs gamr-platform`
2. Vérifiez l'état des conteneurs: `docker ps -a`
3. Consultez les sauvegardes dans `/opt/gamr/backups/`
4. Restaurez depuis une sauvegarde si nécessaire

