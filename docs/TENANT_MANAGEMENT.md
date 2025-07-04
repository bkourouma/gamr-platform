# Gestion des Tenants - GAMR Platform

## Vue d'ensemble

La fonctionnalité de gestion des tenants permet aux **Super Administrateurs** uniquement de créer, modifier, visualiser et gérer les organisations (tenants) sur la plateforme GAMR.

## Fonctionnalités

### 🔐 Contrôle d'accès
- **Accès restreint** : Seuls les utilisateurs avec le rôle `SUPER_ADMIN` peuvent accéder à la gestion des tenants
- **Protection des routes** : Toutes les routes sont protégées par le middleware d'authentification et de vérification des rôles

### 📊 Interface de gestion
- **Vue d'ensemble** : Tableau de bord avec statistiques globales des tenants
- **Liste des tenants** : Affichage en cartes avec informations clés
- **Recherche et filtres** : Recherche par nom/description et filtrage par secteur
- **Actions rapides** : Voir, éditer, activer/désactiver, supprimer

### ✨ Fonctionnalités principales

#### 1. Création de tenant
- Formulaire modal avec validation
- Champs obligatoires : nom, slug
- Champs optionnels : description, secteur, taille, localisation
- Génération automatique du slug basée sur le nom

#### 2. Visualisation des détails
- Modal avec informations complètes du tenant
- Statistiques (utilisateurs, fiches de risques, évaluations)
- Informations générales et métadonnées

#### 3. Modification
- Formulaire d'édition avec données pré-remplies
- Validation des champs
- Mise à jour en temps réel

#### 4. Gestion du statut
- Activation/désactivation des tenants
- Impact sur l'accès des utilisateurs du tenant

#### 5. Suppression
- Suppression sécurisée avec confirmation
- Vérification des dépendances (utilisateurs, données)
- Protection contre la suppression accidentelle

## Utilisation

### Accès à la gestion des tenants
1. Se connecter avec un compte `SUPER_ADMIN`
2. Naviguer vers "Gestion des Tenants" dans le menu latéral
3. L'interface de gestion s'affiche avec la liste des tenants existants

### Créer un nouveau tenant
1. Cliquer sur "Nouveau Tenant"
2. Remplir le formulaire modal :
   - **Nom** (obligatoire) : Nom de l'organisation
   - **Slug** (obligatoire) : Identifiant unique (généré automatiquement)
   - **Description** : Description de l'organisation
   - **Secteur** : Secteur d'activité
   - **Taille** : TPE, PME, ETI, ou GE
   - **Localisation** : Lieu géographique
3. Cliquer sur "Créer le tenant"

### Gérer un tenant existant
- **Voir** : Cliquer sur l'icône œil pour voir les détails
- **Éditer** : Cliquer sur l'icône crayon pour modifier
- **Activer/Désactiver** : Cliquer sur le bouton de statut
- **Supprimer** : Cliquer sur l'icône poubelle (avec confirmation)

## API Endpoints

### Authentification requise
Toutes les routes nécessitent un token JWT valide avec le rôle `SUPER_ADMIN`.

### Routes disponibles

#### GET /api/tenants
Récupère la liste des tenants avec pagination et filtres.

**Paramètres de requête :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `search` : Terme de recherche
- `sector` : Filtrage par secteur
- `isActive` : Filtrage par statut (true/false)

#### POST /api/tenants
Crée un nouveau tenant.

**Corps de la requête :**
```json
{
  "name": "string (obligatoire)",
  "slug": "string (obligatoire)",
  "description": "string (optionnel)",
  "sector": "string (optionnel)",
  "size": "string (optionnel)",
  "location": "string (optionnel)"
}
```

#### GET /api/tenants/:id
Récupère les détails d'un tenant spécifique.

#### PUT /api/tenants/:id
Met à jour un tenant existant.

#### PATCH /api/tenants/:id/toggle-status
Bascule le statut actif/inactif d'un tenant.

#### DELETE /api/tenants/:id
Supprime un tenant (seulement si aucune donnée associée).

## Configuration initiale

### Créer un Super Administrateur
```bash
# Exécuter le script de création
node scripts/create-superadmin.js
```

Cela créera :
- Un tenant administratif "GAMR Administration"
- Un utilisateur superadmin avec les identifiants :
  - Email : `admin@gamr.fr`
  - Mot de passe : `admin123`

### Tester la fonctionnalité
```bash
# Exécuter les tests automatisés
node scripts/test-tenant-management.js
```

## Sécurité

### Contrôles d'accès
- Vérification du rôle `SUPER_ADMIN` sur toutes les routes
- Validation des données d'entrée
- Protection contre les injections SQL via Prisma ORM

### Validation des données
- Validation côté client et serveur
- Unicité du slug garantie
- Vérification des dépendances avant suppression

### Audit et traçabilité
- Toutes les actions sont loggées
- Horodatage des créations et modifications
- Traçabilité des changements de statut

## Dépendances

### Frontend
- React avec TypeScript
- Tailwind CSS pour le styling
- Lucide React pour les icônes
- Axios pour les appels API

### Backend
- Express.js avec TypeScript
- Prisma ORM pour la base de données
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe

## Support

Pour toute question ou problème concernant la gestion des tenants, consultez la documentation technique ou contactez l'équipe de développement.
