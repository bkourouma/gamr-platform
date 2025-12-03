# 🚀 Déploiement GAMRDIGITALE Platform sur Hostinger VPS

## Informations
- **Domaine**: gamrdigitale.engage-360.net
- **Port**: 3005
- **Dossier**: /var/www/gamrdigital
- **VPS IP**: 147.93.44.169

## Étape 1: Connexion SSH
```bash
ssh root@147.93.44.169
```

## Étape 2: Créer le dossier et cloner le repo
```bash
mkdir -p /var/www/gamrdigital
cd /var/www/gamrdigital
git clone https://github.com/bkourouma/gamr-platform.git .
```

## Étape 3: Installer les dépendances et build
```bash
npm ci --production=false
npm run build
```

## Étape 4: Configurer Prisma et la base de données
```bash
mkdir -p logs
npx prisma generate
npx prisma db push
npm run db:seed
```

## Étape 5: Copier la config PM2 et démarrer
```bash
cp deployment/ecosystem.config.cjs ecosystem.config.cjs
pm2 start ecosystem.config.cjs
pm2 save
```

## Étape 6: Configurer Nginx (HTTP d'abord)
```bash
cp deployment/nginx/gamrdigitale.engage-360.net-http.conf /etc/nginx/sites-available/gamrdigitale.engage-360.net
ln -s /etc/nginx/sites-available/gamrdigitale.engage-360.net /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Étape 7: Obtenir le certificat SSL
```bash
certbot certonly --webroot -w /var/www/html -d gamrdigitale.engage-360.net
```

## Étape 8: Activer HTTPS
```bash
cp deployment/nginx/gamrdigitale.engage-360.net.conf /etc/nginx/sites-available/gamrdigitale.engage-360.net
nginx -t
systemctl reload nginx
```

## Vérification
```bash
pm2 status
curl http://localhost:3005/health
```

## URL finale
https://gamrdigitale.engage-360.net

