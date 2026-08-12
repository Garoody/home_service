# HomeServices

[![CI](https://github.com/Garoody/home_service/actions/workflows/ci.yml/badge.svg)](https://github.com/Garoody/home_service/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)

Application web de mise en relation entre des clients et des prestataires de services à domicile. Le projet couvre le parcours de réservation, du catalogue de services jusqu’au paiement simulé et à l’avis client.

> Projet réalisé dans le cadre de la formation AFPA. L’application est conçue pour être exécutée localement ; aucune démonstration publique n’est déclarée dans ce dépôt.

## Télécharger le code

- [Télécharger le projet complet au format ZIP](https://github.com/Garoody/home_service/archive/refs/heads/main.zip)
- [Parcourir le code source sur GitHub](https://github.com/Garoody/home_service/tree/main)

## Sommaire

- [Télécharger le code](#télécharger-le-code)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage local](#démarrage-local)
- [Commandes utiles](#commandes-utiles)
- [Tests et intégration continue](#tests-et-intégration-continue)
- [Sécurité et configuration](#sécurité-et-configuration)
- [Documentation](#documentation)
- [Licence](#licence)

## Fonctionnalités

- Création de comptes et authentification des utilisateurs.
- Gestion de rôles client, prestataire et administrateur.
- Consultation, recherche et publication de services par catégorie.
- Création et suivi de réservations, avec confirmation ou refus côté prestataire.
- Paiement simulé, historique de paiements et moyens de paiement enregistrés.
- Dépôt d’avis, réponses des prestataires et gestion de conversations liées aux réservations.
- Tableau de bord d’administration : modération des utilisateurs, services, avis et signalements.

## Stack technique

- **Backend :** Node.js (Node 22 est utilisé par l’intégration continue), Express 4 et JavaScript ES Modules.
- **Rendu serveur :** EJS avec `express-ejs-layouts`.
- **Base de données :** PostgreSQL et SQL versionné (migrations, vues, triggers et jeux de données).
- **Validation :** Zod.
- **Authentification et sessions :** bcrypt, `express-session`, stockage PostgreSQL et Passport (OAuth Google facultatif).
- **Sécurité et observabilité :** Helmet, CORS, protection CSRF, limitation de débit et Pino.
- **Tests :** Vitest.

## Architecture

Le projet applique une séparation MVC complétée par une couche de services et un *repository pattern* : les contrôleurs orchestrent les requêtes HTTP, les services portent les règles métier et les repositories centralisent l’accès SQL.

```text
home_service/
├── database/               # Migrations, seeders, requêtes, triggers et vues SQL
├── docs/                   # Documentation technique du projet
├── public/                 # Ressources statiques (CSS, JavaScript, images)
├── scripts/                # Scripts d'initialisation et d'administration PostgreSQL
├── src/
│   ├── config/             # Base de données, sécurité, sessions, journalisation
│   ├── controllers/        # Gestion des requêtes et réponses HTTP
│   ├── dto/                # Objets de transfert de données
│   ├── entities/           # Représentation des entités métier
│   ├── middlewares/        # Authentification, autorisations, erreurs, CSRF
│   ├── repositories/       # Accès aux données PostgreSQL
│   ├── routes/             # Définition des routes Express
│   ├── services/           # Règles métier
│   ├── validators/         # Schémas de validation Zod
│   └── views/              # Vues et layouts EJS
└── tests/                  # Tests unitaires Vitest
```

## Démarrage local

### Prérequis

- Node.js 22 recommandé (et npm).
- PostgreSQL, avec les commandes `psql` et `createdb` accessibles dans le `PATH`.
- Un compte PostgreSQL autorisé à créer la base et le rôle applicatif lors de l’initialisation.
- Sous Windows, Git Bash ou WSL pour exécuter les scripts `.sh`.

### 1. Installer les dépendances et préparer l’environnement

```bash
git clone https://github.com/Garoody/home_service.git
cd home_service
npm install
cp .env.example .env
```

Dans PowerShell, la copie du fichier d’environnement peut aussi se faire ainsi :

```powershell
Copy-Item .env.example .env
```

Renseignez ensuite les valeurs locales dans `.env`, en particulier `DATABASE_URL`, les paramètres PostgreSQL, `SESSION_SECRET` et `CSRF_SECRET`. Le fichier modèle ne contient volontairement aucune valeur sensible.

### 2. Initialiser la base de données

Pour une première installation, exécutez le script d’initialisation depuis Git Bash ou WSL :

```bash
sh scripts/init_db.sh
```

Il crée la base si nécessaire, configure les rôles, extensions, types, triggers, tables, permissions et vues SQL. Il propose également d’insérer les données de démonstration.

> Exécutez ce script sur une base de développement vierge. Pour repartir d’une base existante, utilisez plutôt `sh scripts/reset_db.sh` après avoir lu la confirmation demandée.

### 3. Lancer l’application

```bash
npm run dev
```

L’application est disponible sur `http://localhost:3000` par défaut. Le port peut être modifié avec la variable `PORT` dans `.env`.

## Commandes utiles

| Commande | Usage |
| --- | --- |
| `npm run dev` | Lance l’application en mode surveillance avec le fichier `.env`. |
| `npm start` | Lance l’application avec `src/app.js`. |
| `npm test` | Exécute l’ensemble des tests Vitest. |
| `npm run test:unit` | Exécute uniquement les tests unitaires. |
| `npm run test:watch` | Lance Vitest en mode surveillance. |
| `sh scripts/init_db.sh` | Initialise une base PostgreSQL complète en local. |
| `sh scripts/reset_db.sh` | Réinitialise de façon interactive les objets de la base, puis propose une réinitialisation. |
| `sh scripts/nuke_db.sh` | Supprime intégralement la base et le rôle applicatif après double confirmation. À réserver au développement local. |
| `npm run db:up` | Exécute la chaîne de migrations déclarée dans `package.json`. Pour une première installation, préférez `scripts/init_db.sh`, qui configure aussi les rôles, permissions, vues et données de démonstration facultatives. |

## Tests et intégration continue

La suite de tests unitaires couvre notamment l’authentification, les contrôleurs, les services et la validation des données.

```bash
npm test
```

Une intégration continue GitHub Actions exécute `npm ci` puis `npm test` à chaque push et à chaque *pull request*.

## Sécurité et configuration

- `.env` et les variantes `.env.*` sont ignorés par Git ; seul `.env.example` est versionné comme modèle.
- Les mots de passe sont hachés avec bcrypt.
- Les sessions sont stockées dans PostgreSQL.
- Les formulaires sont protégés contre les attaques CSRF.
- Helmet, CORS et la limitation de débit sont configurés au niveau de l’application.
- Les entrées métier sont validées avec Zod avant traitement.

Ne publiez jamais les valeurs de `.env`, notamment les secrets de session, les secrets CSRF, mots de passe PostgreSQL ou identifiants OAuth.

### Connexion avec Google (facultative)

Pour activer le bouton « Continuer avec Google », créez un identifiant OAuth 2.0 de type **Application Web** dans la console Google, puis ajoutez ces valeurs uniquement dans votre fichier local `.env` :

```env
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

Ajoutez également `http://localhost:3000/auth/google/callback` aux URI de redirection autorisés dans Google. Sans ces identifiants, le bouton reste volontairement désactivé.

## Documentation

Les documents techniques disponibles dans [`docs/`](docs) détaillent les principaux choix du projet :

| Sujet | Document |
| --- | --- |
| Architecture MVC et POO | [Guide MVC](docs/logic/02-architecture-mvc.md) |
| Routage et contrôleurs | [Logique de routage](docs/logic/03-routing-logic.md) |
| Connexion PostgreSQL | [Connexion à la base](docs/backend/01-database-connection.md) |
| Validation des données | [Validation avec Zod](docs/backend/03-validation-zod.md) |
| Gestion des erreurs | [Gestion des erreurs](docs/backend/02-error-handling.md) |
| Rendu EJS et ressources statiques | [Architecture frontend](docs/frontend/01-views-and-layout.md) |
| SQL et bonnes pratiques | [Guide SQL](docs/database/01-guide-sql.md) |

## Licence

Ce projet est distribué sous licence [MIT](LICENSE).

---

Développé dans le cadre de la formation AFPA.
