# ⚡ Guide de Déploiement Rapide - Commandes Complètes

## 🎯 Objectif
Déployer vos changements locaux ET remplacer la base de données du serveur par celle de votre développement local.

---

## 📋 Toutes les Commandes (Copier-Coller)

### 🔵 Option 1: Script Automatique (RECOMMANDÉ)

#### Windows PowerShell:
```powershell
.\scripts\deploy-with-db.ps1 -VpsIp "147.93.44.169" -Domain "votre-domaine.com"
```

#### Linux/Mac:
```bash
chmod +x scripts/deploy-with-db.sh
./scripts/deploy-with-db.sh 147.93.44.169 votre-domaine.com
```

---

### 🟢 Option 2: Commandes Manuelles

#### Sur votre machine locale:

```bash
# 1. Vérifier les modifications
git status

# 2. Committer et pousser les changements
git add .
git commit -m "Description de vos changements"
git push origin main

# 3. Créer et transférer l'archive du code
git archive --format=tar.gz -o deploy.tar.gz HEAD
scp deploy.tar.gz root@147.93.44.169:/opt/gamr/
rm deploy.tar.gz

# 4. Transférer la base de données locale
scp prisma/dev.db root@147.93.44.169:/tmp/dev.db
```

#### Sur le serveur (via SSH):

```bash
# Se connecter
ssh root@147.93.44.169

# Une fois connecté au serveur:

# 1. Aller dans le répertoire de l'application
cd /opt/gamr

# 2. Créer une sauvegarde de l'ancienne base de données
mkdir -p backups
docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "cp /data/prod.db /backup/prod-backup-$(date +%Y%m%d_%H%M%S).db 2>/dev/null || echo 'Aucune DB existante'"

# 3. Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down

# 4. Sauvegarder les fichiers importants (.env, SSL)
cp .env .env.backup
cp -r nginx/ssl nginx/ssl.backup

# 5. Extraire le nouveau code
tar -xzf deploy.tar.gz
rm deploy.tar.gz

# 6. Restaurer les fichiers importants
mv .env.backup .env
rm -rf nginx/ssl
mv nginx/ssl.backup nginx/ssl

# 7. Remplacer la base de données dans le volume Docker
docker run --rm -v gamr-platform_gamr-data:/data -v /tmp:/tmp alpine sh -c "
    rm -f /data/prod.db
    cp /tmp/dev.db /data/prod.db
    chmod 644 /data/prod.db
    ls -lh /data/prod.db
"

# 8. Nettoyer le fichier temporaire
rm -f /tmp/dev.db

# 9. Reconstruire et redémarrer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 10. Vérifier les logs
docker logs -f gamr-platform
```

---

## 📝 Checklist Complète

### Avant le déploiement:
- [ ] Code testé localement
- [ ] Base de données locale valide (`prisma/dev.db` existe)
- [ ] Modifications commitées dans Git
- [ ] Modifications poussées vers le repository

### Pendant le déploiement:
- [ ] Sauvegarde de la DB production créée
- [ ] Conteneurs arrêtés
- [ ] Code déployé
- [ ] Base de données remplacée
- [ ] Conteneurs redémarrés

### Après le déploiement:
- [ ] Vérifier les logs: `docker logs gamr-platform`
- [ ] Tester l'API: `curl https://votre-domaine.com/health`
- [ ] Vérifier les données dans l'application web

---

## 🔧 Commandes de Vérification

### Vérifier l'état des conteneurs:
```bash
ssh root@147.93.44.169 "docker ps"
```

### Vérifier les logs:
```bash
ssh root@147.93.44.169 "docker logs gamr-platform"
```

### Vérifier la base de données:
```bash
ssh root@147.93.44.169 "docker run --rm -v gamr-platform_gamr-data:/data alpine ls -lh /data/"
```

### Tester l'API:
```bash
curl https://votre-domaine.com/health
# OU
ssh root@147.93.44.169 "curl http://localhost:3002/health"
```

---

## 🆘 Commandes de Dépannage

### Si le conteneur ne démarre pas:
```bash
ssh root@147.93.44.169
docker logs gamr-platform
docker ps -a
```

### Si besoin de restaurer l'ancienne base de données:
```bash
ssh root@147.93.44.169
cd /opt/gamr
docker-compose -f docker-compose.prod.yml down
docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c "
    rm -f /data/prod.db
    cp /backup/prod-backup-YYYYMMDD_HHMMSS.db /data/prod.db
    chmod 644 /data/prod.db
"
docker-compose -f docker-compose.prod.yml up -d
```

### Si problème de permissions:
```bash
ssh root@147.93.44.169
docker run --rm -v gamr-platform_gamr-data:/data alpine chmod 644 /data/prod.db
docker-compose -f docker-compose.prod.yml restart gamr-app
```

### Redémarrer un service spécifique:
```bash
ssh root@147.93.44.169
cd /opt/gamr
docker-compose -f docker-compose.prod.yml restart gamr-app
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 📊 Informations du Serveur

- **IP VPS:** 147.93.44.169
- **Utilisateur SSH:** root
- **Mot de passe:** Password@Acc225
- **Répertoire App:** /opt/gamr
- **Base de données locale:** prisma/dev.db
- **Base de données production:** Volume Docker `gamr-platform_gamr-data` → `/app/data/prod.db`
- **Sauvegardes:** /opt/gamr/backups

---

## ⚠️ Notes Importantes

1. **TOUJOURS** créer une sauvegarde avant de remplacer la base de données
2. Le processus prend environ 2-5 minutes
3. L'application sera inaccessible pendant le déploiement (1-2 minutes)
4. Vérifiez les logs après le déploiement pour confirmer le succès
5. Si le schéma Prisma a changé, les migrations s'appliqueront au démarrage

---

## 🎯 Commandes en Une Ligne (Pour les Experts)

### Windows PowerShell (une seule commande):
```powershell
git add .; git commit -m "Deploy"; git push; git archive --format=tar.gz -o deploy.tar.gz HEAD; scp deploy.tar.gz root@147.93.44.169:/opt/gamr/; scp prisma/dev.db root@147.93.44.169:/tmp/dev.db; rm deploy.tar.gz; ssh root@147.93.44.169 "cd /opt/gamr && docker-compose -f docker-compose.prod.yml down && docker run --rm -v gamr-platform_gamr-data:/data -v /opt/gamr/backups:/backup alpine sh -c 'cp /data/prod.db /backup/prod-backup-$(date +%Y%m%d_%H%M%S).db 2>/dev/null || true' && tar -xzf deploy.tar.gz && rm deploy.tar.gz && docker run --rm -v gamr-platform_gamr-data:/data -v /tmp:/tmp alpine sh -c 'rm -f /data/prod.db && cp /tmp/dev.db /data/prod.db && chmod 644 /data/prod.db' && rm -f /tmp/dev.db && docker-compose -f docker-compose.prod.yml up -d --build"
```

**Mais il est recommandé d'utiliser le script automatique!** 😊

