# Modèles d'Évaluation GAMR

Ce document décrit les 3 modèles d'évaluation sécuritaire disponibles dans la plateforme GAMR.

## Vue d'ensemble

La plateforme GAMR propose 3 modèles d'évaluation spécialisés basés sur les 42 objectifs de diagnostic sécuritaire :

1. **Modèle Complet** - Évaluation complète avec tous les 42 objectifs
2. **Modèle Sécurité des Biens** - Spécialisé pour les infrastructures et équipements
3. **Modèle Sécurité des Personnes** - Spécialisé pour le personnel et les conditions de travail

## 1. Modèle Complet (42 Objectifs)

**ID:** `gamr-complete-security-v1`
**Titre:** GAMR - Évaluation Sécuritaire Complète (42 Objectifs)

### Description
Questionnaire complet d'évaluation des risques sécuritaires couvrant tous les aspects de la sécurité des biens et des personnes.

### Structure
- **12 sections** couvrant tous les domaines de sécurité
- **42 objectifs** de diagnostic
- **Plus de 200 questions** détaillées

### Sections principales
1. Informations générales de l'entité
2. Première ligne de défense : La périphérie
3. Deuxième ligne de défense : Le périmètre
4. Troisième ligne de défense : Les entrées et accès
5. Quatrième ligne de défense : Protection de l'espace névralgique
6. Matériel de lutte contre l'incendie et engins de sauvetage
7. Sensibilisation du personnel à la sûreté
8. Historique des incidents
9. Comptabilité
10. Assurances
11. Système de protection des documents
12. Vision de responsabilité sociétale

## 2. Modèle Sécurité des Biens

**ID:** `gamr-property-security-v1`
**Titre:** GAMR - Évaluation Sécurité des Biens

### Description
Questionnaire spécialisé pour l'évaluation de la sécurité des biens, infrastructures et équipements.

### Objectifs couverts
- **Objectif 1:** Informations générales (focus biens)
- **Objectif 2:** Diagnostic de la voie d'accès
- **Objectif 3:** Diagnostic de la clôture
- **Objectif 4:** Diagnostic de la structure
- **Objectif 5:** Diagnostic de l'entrée principale
- **Objectif 14:** Diagnostic des fenêtres
- **Objectif 16:** Installation électrique
- **Objectif 17:** Installation d'eau

### Domaines d'évaluation
- **Infrastructures physiques** : Bâtiments, clôtures, voies d'accès
- **Systèmes critiques** : Électricité, eau, éclairage
- **Points d'accès** : Entrées, fenêtres, portails
- **Équipements de sécurité** : Surveillance, alarmes, protection

### Questions types
- État et résistance des matériaux de construction
- Sécurisation des points de raccordement (électricité, eau)
- Protection des équipements et installations
- Systèmes de surveillance et d'alarme

## 3. Modèle Sécurité des Personnes

**ID:** `gamr-personnel-security-v1`
**Titre:** GAMR - Évaluation Sécurité des Personnes

### Description
Questionnaire spécialisé pour l'évaluation de la sécurité des personnes, formation et procédures.

### Objectifs couverts
- **Objectif 1:** Informations générales (focus personnel)
- **Objectif 18:** Ergonomie du matériel de travail
- **Objectif 19:** Caractère salubre du cadre de travail
- **Objectif 20:** Température et confort des locaux
- **Objectif 29:** Matériel médical et premiers secours
- **Objectif 30:** Capacité de réaction face aux menaces
- **Objectif 33:** Formation et sensibilisation sécurité
- **Objectif 34:** Communication de sécurité

### Domaines d'évaluation
- **Conditions de travail** : Ergonomie, confort, salubrité
- **Formation et sensibilisation** : Programmes de formation, communication
- **Santé et sécurité** : Équipements médicaux, premiers secours
- **Préparation aux urgences** : Formation aux situations d'urgence

### Questions types
- Confort et ergonomie des postes de travail
- Programmes de formation à la sécurité
- Disponibilité des équipements de premiers secours
- Sensibilisation du personnel aux risques
- Procédures d'urgence et d'évacuation

## Utilisation des modèles

### Installation
```bash
# Installer les modèles dans la base de données
npm run db:seed-models
```

### Sélection du modèle approprié

**Utilisez le modèle complet quand :**
- Vous voulez une évaluation exhaustive
- C'est la première évaluation d'un site
- Vous avez besoin d'un diagnostic global

**Utilisez le modèle sécurité des biens quand :**
- Vous vous concentrez sur les infrastructures
- Vous évaluez un nouveau bâtiment
- Vous auditez les équipements de sécurité

**Utilisez le modèle sécurité des personnes quand :**
- Vous évaluez les conditions de travail
- Vous auditez la formation du personnel
- Vous vous concentrez sur le bien-être au travail

## Questions communes

Certaines questions apparaissent dans plusieurs modèles car elles concernent à la fois les biens et les personnes :

- Informations générales de l'entité
- Systèmes de communication d'urgence
- Équipements de sécurité incendie
- Procédures d'évacuation

## Évolution des modèles

Les modèles peuvent être étendus ou modifiés selon les besoins spécifiques de votre organisation. Contactez l'administrateur système pour personnaliser les questionnaires.
