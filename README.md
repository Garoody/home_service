🏠 HomeServices — Plateforme de Services à Domicile

HomeServices est une application web permettant de mettre en relation des clients et des prestataires de services à domicile (ménage, plomberie, jardinage, réparation, etc.).

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table des matières

🎯 [Objectif du projet](#-objectif-du-projet)
🛠 [Stack Technique] (#-stack-technique)
📁 [Architecture du projet] (#-architecture-du-projet)
🚀 Installation & Démarrage (#-installation--démarrage)
📚 Documentation (#-documentation)
📊 Modèle de données (#-exercices-pratiques)
🧪 Scripts utilitaires (#-scripts-utilitaires)
📝 Licence (#-license)

## 🎯 Objectif du projet

HomeServices permet :

👤 Aux clients de rechercher et réserver des services à domicile.

🛠 Aux prestataires de proposer leurs services.

⭐ Aux utilisateurs de laisser des avis et évaluations.

💳 De simuler un système de paiement.

📊 À l’administrateur de gérer la plateforme.

L’objectif est de développer une architecture professionnelle backend + base de données optimisée.

🛠 Stack Technique

Backend : Node.js (ES Modules) / Express.js 5.x

Frontend : EJS (Server-Side Rendering)

Base de données : PostgreSQL

Validation : Zod

Sécurité : UUID v7, Argon2/Bcrypt, rôles applicatifs SQL

Architecture : MVC + Repository Pattern + Service Layer

## 📁 Architecture du projet

homeservices/
│
├─ 📦 database/ # Intelligence SQL
│ ├─ migrations/ # Création tables, types, extensions
│ ├─ seeders/ # Données de test
│ ├─ queries/ # Requêtes SQL métiers
│ ├─ triggers/ # Trigger updated_at
│ └─ views/ # Vues SQL (jointures complexes)
│
├─ 📚 docs/ # Documentation technique
│ ├─ backend/
│ ├─ database/
│ ├─ frontend/
│ └─ architecture.md
│
├─ 🔧 scripts/ # Automatisation DB
│ ├─ init_db.sh
│ ├─ reset_db.sh
│ └─ seed_db.sh
│
├─ 💻 src/
│ ├─ config/ # Connexion DB, sécurité
│ ├─ entities/ # Représentation tables
│ ├─ dto/ # Objets sécurisés pour vues/API
│ ├─ repositories/ # Requêtes SQL pures
│ ├─ services/ # Logique métier
│ ├─ controllers/ # Gestion req/res
│ ├─ middlewares/ # Auth, validation, erreurs
│ ├─ routes/ # Définition routes Express
│ ├─ validators/ # Schémas Zod
│ └─ views/ # Templates EJS
│
└─ 🎨 public/ # CSS / JS / Images
🚀 Installation & Démarrage
1️⃣ Configuration de l’environnement
cp .env.example .env

# Modifier les variables PostgreSQL

2️⃣ Initialisation de la base de données
chmod +x scripts/\*.sh
npm run db:init
3️⃣ Lancer l’application
npm install
npm run dev

Le serveur démarre sur :

http://localhost:3000
📚 Documentation

Consulte le dossier docs/ pour :

Domaine Document
Architecture MVC architecture.md
Base de données database-guide.md
Validation 03-validation-zod.md
Gestion erreurs 02-error-handling.md
📊 Modèle de données
Tables principales

users → Clients / Prestataires / Admin

categories → Types de services

services → Services proposés

bookings → Réservations

payments → Paiements liés aux réservations

reviews → Avis clients

Relations clés

Un prestataire peut avoir plusieurs services

Un client peut faire plusieurs réservations

Une réservation peut avoir :

1 paiement

1 avis

🧪 Scripts utilitaires
Script Action
npm run db:init Initialise la base complète
npm run db:reset Réinitialise proprement
npm run db:seed Injecte données test
📝 Licence

Projet sous licence MIT.

<div align="center">

Développé dans le cadre de la formation AFPA
Dernière mise à jour : 24/02/2026

</div> ```
