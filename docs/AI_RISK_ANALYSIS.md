# Système d'Analyse IA pour les Fiches de Risques GAMR

## Vue d'ensemble

Le système d'analyse IA pour les fiches de risques GAMR utilise les réponses aux évaluations de sécurité pour fournir des recommandations intelligentes sur la **Probabilité**, la **Vulnérabilité** et les **Repercussions** d'un risque donné.

## Fonctionnalités

### 🧠 Analyse IA Intelligente
- **Analyse contextuelle** basée sur les réponses aux questionnaires d'évaluation
- **Recommandations personnalisées** pour chaque critère GAMR
- **Explications détaillées** avec points positifs et négatifs
- **Niveau de confiance** pour chaque recommandation

### 📊 Interface Utilisateur
- **Bouton "Analyse IA"** dans la section GAME
- **Recommandations visuelles** sous chaque critère
- **Évaluation globale** dans le panneau de droite
- **Application automatique** des recommandations

## Comment utiliser le système

### 1. Prérequis
- Avoir des **évaluations de sécurité** complétées dans le système
- Renseigner la **cible potentielle** et le **scénario de menace**

### 2. Processus d'analyse
1. **Accéder** à la page de création de fiche de risque : `/risks/new`
2. **Remplir** les champs "Cible potentielle" et "Scénario de menace"
3. **Cliquer** sur le bouton "Analyse IA" dans la section GAME
4. **Attendre** l'analyse (2-3 secondes)
5. **Consulter** les recommandations pour chaque critère
6. **Appliquer** les recommandations ou ajuster manuellement

### 3. Interprétation des résultats

#### Probabilité (1-3)
- **1 - Faible** : Peu de chances que le risque se matérialise
- **2 - Moyen** : Probabilité modérée de matérialisation
- **3 - Élevé** : Forte probabilité de matérialisation

#### Vulnérabilité (1-4)
- **1 - Très faible** : Système très résistant
- **2 - Faible** : Bonnes défenses en place
- **3 - Moyen** : Quelques faiblesses identifiées
- **4 - Élevé** : Vulnérabilités critiques

#### Repercussions (1-5)
- **1 - Négligeable** : Impact minimal
- **2 - Mineur** : Impact limité et gérable
- **3 - Modéré** : Perturbations significatives
- **4 - Majeur** : Conséquences importantes
- **5 - Critique** : Impact catastrophique

## Algorithme d'analyse

### Analyse des évaluations
Le système analyse les réponses aux évaluations pour identifier :
- **Faiblesses critiques** (réponses négatives aux questions de sécurité)
- **Points forts** (mesures de sécurité en place)
- **Niveau de sécurité global** (ratio de réponses négatives)
- **Domaines spécifiques** (contrôle d'accès, périmètre, formation, etc.)

### Calcul des scores
Pour chaque critère, l'IA :
1. **Analyse** le type de cible et de scénario
2. **Corrèle** avec les faiblesses identifiées dans les évaluations
3. **Ajuste** le score selon les points forts/faibles
4. **Génère** une explication détaillée
5. **Calcule** un niveau de confiance

### Facteurs pris en compte

#### Probabilité
- Défaillances du contrôle d'accès
- Sécurité périmétrique insuffisante
- Historique d'incidents
- Systèmes de surveillance
- Formation du personnel

#### Vulnérabilité
- Vulnérabilités techniques identifiées
- Procédures de sécurité documentées
- Niveau de formation du personnel
- Mesures de protection physique

#### Repercussions
- Type de cible (données, infrastructure, personnel)
- Criticité des systèmes
- Mesures de mitigation en place
- Capacité de récupération

## Exemples d'utilisation

### Cas 1 : Accès non autorisé
**Cible** : "Serveurs de production"
**Scénario** : "Intrusion par défaillance du contrôle d'accès"

**Analyse IA** :
- Si les évaluations montrent des faiblesses dans le contrôle d'accès → Probabilité élevée
- Si pas de surveillance → Vulnérabilité élevée
- Serveurs critiques → Repercussions majeures

### Cas 2 : Vol de données
**Cible** : "Base de données clients"
**Scénario** : "Cyberattaque par phishing"

**Analyse IA** :
- Formation insuffisante du personnel → Probabilité élevée
- Pas de sensibilisation cybersécurité → Vulnérabilité élevée
- Données sensibles → Repercussions critiques

## Configuration technique

### Fichiers impliqués
- `src/lib/risk-ai-analysis.ts` : Logique d'analyse IA
- `src/components/RiskSheetForm.tsx` : Interface utilisateur
- `src/lib/api.ts` : Intégration API

### Dépendances
- Système d'évaluations existant
- API des évaluations
- Base de données Prisma

## Améliorations futures

### 🔮 Fonctionnalités avancées
- **Machine Learning** pour améliorer la précision
- **Analyse de tendances** temporelles
- **Corrélations** entre différents risques
- **Recommandations d'actions** automatiques

### 📈 Optimisations
- **Cache** des analyses pour améliorer les performances
- **Analyse en temps réel** lors de la saisie
- **Intégration** avec des sources de données externes
- **Personnalisation** par secteur d'activité

## Support et maintenance

### Logs et debugging
- Les analyses sont loggées dans la console
- Niveau de confiance affiché pour chaque recommandation
- Messages d'erreur explicites en cas de problème

### Monitoring
- Suivi du taux d'utilisation du système
- Mesure de la précision des recommandations
- Feedback utilisateur pour amélioration continue

---

**Note** : Ce système est conçu pour assister les analystes de risques, pas pour les remplacer. Les recommandations doivent toujours être validées par un expert humain.
