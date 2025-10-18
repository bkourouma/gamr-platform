#!/bin/bash
# Script de vérification du déploiement GAMR sur VPS Hostinger
# Usage: ./check-hostinger-deployment.sh <ip-vps> [domaine]

# Vérifier les arguments
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <ip-vps> [domaine]"
    echo "Exemple: $0 123.456.789.012 example.com"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
SSH_USER="root"
APP_DIR="/opt/gamr"

echo -e "\e[36m🔍 Vérification du déploiement GAMR Platform sur VPS Hostinger\e[0m"
echo "------------------------------------------------"
echo "IP du VPS: $VPS_IP"
if [ ! -z "$DOMAIN" ]; then echo "Domaine: $DOMAIN"; fi
echo "------------------------------------------------"

# Vérifier l'état des conteneurs Docker
echo -e "\e[33m📊 Vérification des conteneurs Docker...\e[0m"
ssh $SSH_USER@$VPS_IP "docker ps -a"
echo ""

# Vérifier les logs récents
echo -e "\e[33m📜 Logs récents de l'application...\e[0m"
ssh $SSH_USER@$VPS_IP "docker logs --tail 20 gamr-platform 2>&1"
echo ""

# Vérifier l'utilisation des ressources
echo -e "\e[33m💻 Utilisation des ressources...\e[0m"
ssh $SSH_USER@$VPS_IP "docker stats --no-stream gamr-platform"
echo ""

# Vérifier l'état de santé de l'application
echo -e "\e[33m🩺 Vérification de l'état de santé de l'application...\e[0m"
if [ ! -z "$DOMAIN" ]; then
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null)
    if [ "$HEALTH_STATUS" == "200" ]; then
        echo -e "\e[32m✅ L'application est en ligne et répond correctement.\e[0m"
    else
        echo -e "\e[33m⚠️ L'application répond avec le code: $HEALTH_STATUS\e[0m"
    fi
else
    echo -e "\e[34mℹ️ Aucun domaine spécifié. Vérification de santé via domaine ignorée.\e[0m"
fi
echo ""

# Vérifier les sauvegardes
echo -e "\e[33m💾 Vérification des sauvegardes...\e[0m"
ssh $SSH_USER@$VPS_IP "ls -la $APP_DIR/backups/"
echo ""

# Vérifier les certificats SSL
if [ ! -z "$DOMAIN" ]; then
    echo -e "\e[33m🔒 Vérification des certificats SSL...\e[0m"
    ssh $SSH_USER@$VPS_IP "certbot certificates | grep -A 2 $DOMAIN"
    echo ""
fi

# Vérifier l'état du pare-feu
echo -e "\e[33m🛡️ État du pare-feu...\e[0m"
ssh $SSH_USER@$VPS_IP "ufw status"
echo ""

echo "------------------------------------------------"
echo -e "\e[36m🎯 Actions recommandées:\e[0m"
echo "------------------------------------------------"
echo "1. Pour redémarrer l'application:"
echo "   ssh $SSH_USER@$VPS_IP 'cd $APP_DIR && docker-compose -f docker-compose.prod.yml restart'"
echo ""
echo "2. Pour mettre à jour l'application:"
echo "   ssh $SSH_USER@$VPS_IP 'cd $APP_DIR && git pull && docker-compose -f docker-compose.prod.yml up -d --build'"
echo ""
echo "3. Pour forcer une sauvegarde de la base de données:"
echo "   ssh $SSH_USER@$VPS_IP '$APP_DIR/backup.sh'"
echo ""
echo "4. Pour voir les logs en temps réel:"
echo "   ssh $SSH_USER@$VPS_IP 'docker logs -f gamr-platform'"
echo "------------------------------------------------"
