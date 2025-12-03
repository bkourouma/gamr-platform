📄 SERVER-APPS-DOCUMENTATION.md
🖥️ VPS – Applications & Configuration Complète

Serveur principal de production – Hostinger

🧩 Informations générales

Provider : Hostinger

Hostname : srv917891

Adresse IP : 147.93.44.169

OS : Ubuntu 22.04

Nginx main config : /etc/nginx/nginx.conf

Nginx sites-available : /etc/nginx/sites-available/

Nginx sites-enabled : /etc/nginx/sites-enabled/

PM2 home : /root/.pm2

⚠️ INSTRUCTION POUR LLM (À LIRE AVANT TOUTE ACTION)

Tu dois absolument respecter ces règles :

✅ 1. NE JAMAIS mismatcher les ports

Chaque application possède un port unique, un chemin unique et un processus unique.
Lorsqu’un LLM donne une commande, une correction ou une modification Nginx/PM2, il doit :

Vérifier le port exact associé à l’app

Vérifier le chemin exact

Vérifier le type d’exécution (PM2 ou Docker ou Next.js)

Ne jamais supposer : toujours se baser sur ce fichier

❌ 2. NE PAS échanger les apps entre elles

NE PAS :

Proposer de changer le port d’une app vers un autre déjà utilisé

Mélanger imhotepformation avec gamr

Confondre apps Docker / apps PM2

Proposer un restart d’un service qui ne correspond pas à l’app ciblée

✅ 3. Toujours demander confirmation si :

Il faut modifier un port

Il faut éditer un fichier Nginx

Il faut éditer un fichier PM2

Le port semble non actif

📦 1. GAMR – Site Public

Domaine : https://gestionrisques.com

Serveur : srv917891

App Directory : /opt/gamr

PM2 App Name : gamr-site

Port : 3022

Nginx Config : /etc/nginx/sites-available/gestionrisques.com

Déploiement :

cd /opt/gamr
git pull
pnpm install
pnpm build
pm2 restart gamr-site

📦 2. GAMR – Sous-domaine (identique, même app)

Domaine : https://gamr.engage-360.net

App Directory : /opt/gamr

PM2 App Name : gamr-site

Port : 3022

Nginx Config : /etc/nginx/sites-available/gamr.engage-360.net

📦 3. GAMR Digitale (Backend)

Domaine : https://gamrdigitale.engage-360.net

App Directory : /var/www/gamrdigital

PM2 App Name : gamrdigital

Port : 3005

Nginx Config : /etc/nginx/sites-available/gamrdigitale.engage-360.net

📦 4. GAMR Platform – Docker

Domaine : https://gamerplatform.engage-360.net

App Directory : /opt/gamr

Docker Compose file : /opt/gamr/docker-compose.prod.yml

Container name : gamr-platform

Port exposé : 3002

Nginx Config : /etc/nginx/sites-available/gamerplatform.engage-360.net

📦 5. BMI Chat (Frontend + Backend via Docker)

Domaine : https://bmi.engage-360.net

App Directory : /var/www/bmichat

Docker compose project : bmichat

Frontend :

Container : bmi-chat-frontend

Port exposé : 8099

Backend :

Container : bmi-chat-backend

Port exposé : 3006

📦 6. AI Agent Platform

Domaine : https://agents.engage-360.net

App Directory : /opt/ai-agent-platform

PM2 App Name : TODO (non configuré)

Port attendu : 8092

Nginx Config : /etc/nginx/sites-available/ai-agent-platform

(NOTE : l’app ne tourne pas actuellement — port 8092 non ouvert)

📦 7. ASP Afrique (Monorepo)

Domaine : https://asp-afrique.com

App Directory : /var/www/asp-afrique

Frontend (Next.js)

Directory : /var/www/asp-afrique/apps/web

Port : 3000

Backend (Fastify)

Directory : /var/www/asp-afrique/apps/api

Port : 3004

Nginx Config : /etc/nginx/sites-available/asp-afrique.com

📦 8. ImhotepFormation

Domaine : https://imhotepformation.engage-360.net

App Directory : /opt/imhotepformation

PM2 App Name : imhotepformation-app

Port : 3001

Entry file : /opt/imhotepformation/server/server.js

Nginx Config : /etc/nginx/sites-available/imhotepformation.engage-360.net

📦 9. Chat360

Domaine : https://chat.engage-360.net

App Directory : /opt/chat360

Docker Compose File : /opt/chat360/docker-compose.production.yml

Port exposé : 8080

Nginx Config : /etc/nginx/sites-available/chat.engage-360.net

📦 10. Engage-360 Website

Domaine : https://engage-360.net

App Directory : /var/www/engage-360-website

PM2 App Name : TODO

Port attendu : 8000

Nginx Config : /etc/nginx/sites-available/engage360

(Note : l’app 8000 ne tourne pas actuellement)

🧪 Section: Monitoring des ports

Commande utile :

ss -lntp


Ports utilisés :

Service / Domaine	Port
GAMR Site	3022
GAMR Digitale	3005
GAMR Platform (Docker)	3002
BMI Chat Frontend	8099
BMI Chat Backend	3006
AI Agent Platform	8092 (INACTIF)
ASP Afrique Web	3000
ASP Afrique API	3004
ImhotepFormation	3001
Chat360	8080
Engage360 Website	8000 (INACTIF)
🛠️ Section: Procédures Générales
🔄 Restart Nginx
sudo systemctl restart nginx
sudo systemctl reload nginx

🔍 Restart PM2 app
pm2 restart APP_NAME
pm2 logs APP_NAME

🐳 Restart Docker services
cd APP_DIRECTORY
docker compose down
docker compose up -d

📌 FIN DU DOCUMENT