# 🚀 GAMR Platform - Déploiement sur Hostinger VPS

Ce document fournit des instructions rapides pour déployer la plateforme GAMR sur un VPS Hostinger.

## 📋 Prérequis

- Un VPS Hostinger (recommandé: au moins 2 vCPU, 4GB RAM)
- Un nom de domaine configuré dans Hostinger
- Accès SSH au VPS
- Git installé sur votre machine locale
- OpenSSH ou Git Bash installé sur votre machine locale (pour Windows)

## 🚀 Déploiement Rapide

### Sous Windows (PowerShell)

1. Ouvrez PowerShell en tant qu'administrateur
2. Naviguez vers le répertoire du projet
3. Exécutez le script de déploiement:

```powershell
.\scripts\deploy-to-hostinger.ps1 -VpsIp "votre-ip-vps" -Domain "votre-domaine.com"
```

### Sous Linux/Mac

1. Ouvrez un terminal
2. Naviguez vers le répertoire du projet
3. Rendez le script exécutable et exécutez-le:

```bash
chmod +x scripts/deploy-to-hostinger.sh
./scripts/deploy-to-hostinger.sh votre-ip-vps votre-domaine.com
```

## 📝 Que fait le script de déploiement?

1. Prépare le serveur VPS (mise à jour, installation de Docker, etc.)
2. Déploie les fichiers de l'application
3. Configure les certificats SSL avec Let's Encrypt
4. Déploie l'application avec Docker Compose
5. Configure les sauvegardes automatiques
6. Installe Netdata pour le monitoring
7. Configure des mesures de sécurité supplémentaires (Fail2Ban)

## 🔍 Vérification du déploiement

Après le déploiement, vous pouvez accéder à:

- Application GAMR: `https://votre-domaine.com`
- Monitoring Netdata: `http://votre-ip-vps:19999`

## 📚 Documentation détaillée

Pour des instructions plus détaillées et des options avancées, consultez le fichier [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md).

## ⚙️ Maintenance

### Mise à jour de l'application

```bash
ssh root@votre-ip-vps
cd /opt/gamr
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Sauvegarde manuelle de la base de données

```bash
ssh root@votre-ip-vps
/opt/gamr/backup.sh
```

### Vérification des logs

```bash
ssh root@votre-ip-vps
docker logs gamr-platform
```

## 🆘 Dépannage

En cas de problème, consultez la section "Dépannage" dans le fichier [HOSTINGER_DEPLOYMENT.md](./HOSTINGER_DEPLOYMENT.md).
