# Gestion des Utilisateurs - GAMR Platform

## Vue d'ensemble

La fonctionnalité de gestion des utilisateurs permet aux **Administrateurs** et **Super Administrateurs** de créer, modifier, visualiser et gérer les comptes utilisateurs sur la plateforme GAMR.

## Contrôle d'accès

### Rôles autorisés
- **SUPER_ADMIN** : Accès complet à tous les utilisateurs de tous les tenants
- **ADMIN** : Accès aux utilisateurs de leur tenant uniquement

### Restrictions
- Un utilisateur ne peut pas modifier son propre statut
- Un utilisateur ne peut pas supprimer son propre compte
- Les admins ne peuvent gérer que les utilisateurs de leur tenant
- Seuls les super admins peuvent créer d'autres super admins

## Fonctionnalités

### 🔍 **Visualisation et recherche**
- **Liste des utilisateurs** avec informations clés
- **Recherche** par nom, prénom ou email
- **Filtres** par rôle et tenant (pour super admins)
- **Statistiques** globales des utilisateurs

### ➕ **Création d'utilisateurs**
- **Formulaire complet** avec validation
- **Champs obligatoires** : prénom, nom, email, mot de passe
- **Sélection du rôle** selon les permissions
- **Attribution du tenant** (super admin uniquement)

### ✏️ **Modification d'utilisateurs**
- **Édition des informations** personnelles
- **Changement de rôle** selon les permissions
- **Activation/désactivation** des comptes
- **Changement de mot de passe**

### 👁️ **Consultation des détails**
- **Informations complètes** de l'utilisateur
- **Historique de connexion**
- **Statut du compte**
- **Appartenance au tenant**

## Rôles disponibles

### 🔴 **SUPER_ADMIN**
- Accès global à tous les tenants
- Gestion complète des utilisateurs et tenants
- Création d'autres super admins

### 🟣 **ADMIN**
- Administration du tenant
- Gestion des utilisateurs du tenant
- Configuration des paramètres

### 🔵 **AI_ANALYST**
- Configuration des modèles IA
- Analyse des données de risques
- Création et modification des évaluations

### 🟢 **EVALUATOR**
- Création et modification des fiches de risques
- Réalisation des évaluations
- Gestion des actions correctives

### ⚪ **READER**
- Accès en lecture seule
- Consultation des rapports
- Visualisation des données

## Utilisation

### Accès à la gestion des utilisateurs
1. Se connecter avec un compte `ADMIN` ou `SUPER_ADMIN`
2. Naviguer vers "Gestion des Utilisateurs" dans le menu latéral
3. L'interface de gestion s'affiche avec la liste des utilisateurs

### Créer un nouvel utilisateur
1. Cliquer sur "Nouvel Utilisateur"
2. Remplir le formulaire :
   - **Prénom** et **Nom** (obligatoires)
   - **Email** (obligatoire, format valide)
   - **Mot de passe** (obligatoire, minimum 6 caractères)
   - **Rôle** (selon vos permissions)
   - **Tenant** (super admin uniquement)
3. Cliquer sur "Créer l'utilisateur"

### Gérer un utilisateur existant
- **Voir** : Cliquer sur l'icône œil pour voir les détails
- **Éditer** : Cliquer sur l'icône crayon pour modifier
- **Activer/Désactiver** : Cliquer sur le bouton de statut
- **Supprimer** : Cliquer sur l'icône poubelle (avec confirmation)

## API Endpoints

### Authentification requise
Toutes les routes nécessitent un token JWT valide avec le rôle `ADMIN` ou `SUPER_ADMIN`.

### Routes disponibles

#### GET /api/users
Récupère la liste des utilisateurs avec pagination et filtres.

#### POST /api/users
Crée un nouvel utilisateur.

#### GET /api/users/:id
Récupère les détails d'un utilisateur spécifique.

#### PUT /api/users/:id
Met à jour un utilisateur existant.

#### PATCH /api/users/:id/toggle-status
Bascule le statut actif/inactif d'un utilisateur.

#### PATCH /api/users/:id/password
Change le mot de passe d'un utilisateur.

#### DELETE /api/users/:id
Supprime un utilisateur.

## Configuration initiale

### Créer un administrateur
```bash
# Exécuter le script de création
node scripts/create-admin-user.js
```

Cela créera :
- Un administrateur pour le premier tenant actif
- Quelques utilisateurs de test avec différents rôles

### Identifiants créés
- **Admin** : `admin@[tenant-slug].com` / `admin123`
- **Évaluateur** : `evaluator@[tenant-slug].com` / `test123`
- **Analyste** : `analyst@[tenant-slug].com` / `test123`
- **Lecteur** : `reader@[tenant-slug].com` / `test123`

## Sécurité

### Contrôles d'accès
- Vérification du rôle sur toutes les routes
- Isolation des données par tenant
- Protection contre l'auto-modification/suppression

### Validation des données
- Validation des emails
- Contrôle de la force des mots de passe
- Vérification de l'unicité des emails

### Audit et traçabilité
- Horodatage des créations et modifications
- Suivi des dernières connexions
- Logs des actions administratives

## Bonnes pratiques

### Gestion des mots de passe
- Utiliser des mots de passe forts (minimum 6 caractères)
- Changer les mots de passe par défaut
- Informer les utilisateurs de leurs identifiants de manière sécurisée

### Attribution des rôles
- Principe du moindre privilège
- Révision régulière des permissions
- Documentation des attributions de rôles

### Maintenance des comptes
- Désactivation des comptes inutilisés
- Suppression des comptes obsolètes
- Surveillance des connexions suspectes

## Support

Pour toute question concernant la gestion des utilisateurs, consultez la documentation technique ou contactez l'équipe de développement.
