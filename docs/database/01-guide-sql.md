Ce guide définit les standards, la sécurité et les optimisations de la base de données **PostgreSQL** du projet **HomeServices**.

---

## 📌 Sommaire

1. [📖 Glossaire](#-glossaire-pour-la-base-de-données)
2. [🔐 Sécurité et bonnes pratiques](#-règles-de-sécurité-et-bonnes-pratiques)
   - [Accès Rôles](#1-ne-jamais-connecter-lapplication-avec-le-rôle-postgres)
   - [Mots de passe](#2-toujours-hasher-les-mots-de-passe-côté-backend)
   - [RGPD & Droit à l'oubli](#3-rgpd-cascade-et-droit-à-loubli)
3. [📊 Indexation & Performance](#-règles-dindexation-performance)
   - [Index automatiques vs manuels](#1-postgresql-crée-automatiquement-des-index-pour-)
   - [Index utiles dans-homeservices](#2-quand-créer-un-index-manuel-)
   - [Éviter la sur-indexation](#3-éviter-la-sur-indexation)
4. [🎯 Types de données](#-règles-sur-les-types-de-données)
   - [ENUM vs CHECK](#1-utiliser-enum-au-lieu-de-varchar--check)
   - [CITEXT](#2-citext-pour-email-insensibilité-casse)
   - [UUID v7](#3-uuid-v7-pour-les-identifiants)
5. [🔄 Relations & Cardinalités](#-règles-sur-les-relations-cardinalités)
6. [⚡ Automatisation (Triggers)](#-règles-dautomatisation)
7. [🔍 Recherche & filtres](#-règles-de-recherche-et-filtres)
8. [📋 Checklist Production](#-checklist-avant-mise-en-production)
9. [🧠 Philosophie KISS](#-principe-kiss-appliqué-à-la-db)

---

## 📖 Glossaire pour la base de données

- **DCL (Data Control Language)** : Commandes pour gérer les droits et l'accès (ex: `CREATE ROLE`, `GRANT`). → Sécurité.
- **DDL (Data Definition Language)** : Commandes pour définir la structure (ex: `CREATE TABLE`, `ALTER`). → Architecture.
- **DML (Data Manipulation Language)** : Commandes pour manipuler les données (ex: `SELECT`, `INSERT`, `UPDATE`, `DELETE`). → Contenu.

---

## 🔐 Règles de sécurité et bonnes pratiques

### **1. Ne JAMAIS connecter l'application avec le rôle `postgres`**

```sql
-- ❌ DANGEREUX : Utiliser postgres en production
DATABASE_URL=postgresql://postgres:password@localhost/service_db

-- ✅ CORRECT : Créer un rôle applicatif dédié
CREATE ROLE app_homeservices WITH LOGIN PASSWORD 'motdepassefort';
GRANT CONNECT ON DATABASE service_db TO app_homeservices;

-- Sur le schéma public (à adapter selon ton setup)
GRANT USAGE ON SCHEMA public TO app_homeservices;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_homeservices;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_homeservices;

-- Dans l'application :
DATABASE_URL=postgresql://app_homeservices:motdepassefort@localhost/service_db

Pourquoi ?

postgres = super-admin (peut tout supprimer)

un rôle applicatif = droits limités (réduit les risques en cas de faille)

2. Toujours hasher les mots de passe (côté backend)
-- ❌ JAMAIS stocker en clair
INSERT INTO users (password_hash) VALUES ('monmotdepasse123');

✅ Exemple backend (bcrypt) :

import bcrypt from "bcrypt";

const hash = await bcrypt.hash(password, 10);
// INSERT INTO users(password_hash) VALUES ($1) avec $1 = hash

✅ Alternatives recommandées :

bcrypt (10–12 rounds)

Argon2 (moderne, recommandé OWASP)

3. RGPD : Cascade et droit à l'oubli

Dans HomeServices, les données personnelles doivent pouvoir être supprimées.

Exemples où CASCADE est pertinent :

payments dépend de bookings

reviews dépend de bookings

-- ✅ Si une réservation est supprimée, le paiement et l'avis liés disparaissent
payments.booking_id REFERENCES bookings(id_booking) ON DELETE CASCADE
reviews.booking_id REFERENCES bookings(id_booking) ON DELETE CASCADE

Article RGPD concerné : Article 17 (Droit à l'effacement)

📊 Règles d'indexation (Performance)
1. PostgreSQL crée automatiquement des index pour :
Contrainte	Index auto ?	Type
PRIMARY KEY	✅ OUI	B-tree UNIQUE
UNIQUE	✅ OUI	B-tree UNIQUE
FOREIGN KEY	❌ NON	Aucun (à créer manuellement)

Exemple :

-- ❌ REDONDANT : email est déjà UNIQUE → index auto
email CITEXT UNIQUE;
CREATE INDEX idx_users_email ON users(email); -- inutile

-- ✅ NÉCESSAIRE : FK → pas d'index auto
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
2. Quand créer un index manuel ?
✅ Index utiles dans HomeServices

FKs (obligatoire)

Colonnes filtrées souvent : status, role, payment_status

Tri fréquent : created_at DESC

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_status ON payments(payment_status);
3. Éviter la sur-indexation
❌ Mauvaises pratiques
-- Trop d'index inutiles = insertion plus lente
CREATE INDEX idx_users_created ON users(created_at); -- rarement utile
CREATE INDEX idx_users_updated ON users(updated_at); -- rarement utile

Coût d’un index inutile :

stockage

ralentit INSERT/UPDATE

faible gain sur SELECT

🎯 Règles sur les types de données
1. Utiliser ENUM au lieu de VARCHAR + CHECK
-- ✅ HomeServices utilise des types natifs
CREATE TYPE role_enum AS ENUM ('client','provider','admin');
CREATE TYPE booking_status_enum AS ENUM ('pending','confirmed','completed','cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending','paid');

Avantages :

typage fort

erreurs claires

plus performant que VARCHAR + CHECK

2. CITEXT pour email (insensibilité casse)
-- ✅ Panda@mail.com = panda@mail.com
email CITEXT UNIQUE NOT NULL;

Extension requise :

CREATE EXTENSION IF NOT EXISTS citext;
3. UUID v7 pour les identifiants
-- ✅ Identifiants triables et performants
id_user UUID PRIMARY KEY DEFAULT uuidv7();

Avantages :

contient un timestamp → index plus “rangé”

meilleur tri naturel

🔄 Règles sur les relations (cardinalités)
1. Relations principales HomeServices

users (provider) → services : (1,N)

categories → services : (1,N)

users (client) → bookings : (1,N)

services → bookings : (1,N)

bookings → payments : (1,1) (unique)

bookings → reviews : (1,1) (unique)

2. ON DELETE : CASCADE vs RESTRICT

RESTRICT : empêche suppression si dépendances (ex: supprimer un provider ayant des services)

CASCADE : supprime les données liées (ex: bookings → payments/reviews)

Dans ton schéma :

services.provider_id : ON DELETE RESTRICT ✅

payments.booking_id : ON DELETE CASCADE ✅

reviews.booking_id : ON DELETE CASCADE ✅

⚡ Règles d'automatisation (Triggers)
1. Trigger pour updated_at

Fonction réutilisable :

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

Application :

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

Pourquoi ?

évite d’oublier updated_at dans le code

cohérence garantie

2. Valeurs par défaut intelligentes
created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
id_* UUID PRIMARY KEY DEFAULT uuidv7()
payment_status payment_status_enum NOT NULL DEFAULT 'pending'
status booking_status_enum NOT NULL DEFAULT 'pending'
🔍 Règles de recherche et filtres
1. Filtres de base (recommandés)

Services : catégorie, prix, prestataire

Bookings : status, date

Reviews : provider_id

Index déjà utiles :

services.category_id

services.provider_id

bookings.status

reviews.provider_id

2. Recherche textuelle simple

Pour une recherche simple (titre/description) :

SELECT *
FROM services
WHERE title ILIKE '%plomberie%'
   OR description ILIKE '%plomberie%';

Pour aller plus loin : full-text search (à ajouter plus tard si besoin).

📋 Checklist avant mise en production
✅ Sécurité

 Rôle applicatif créé (pas postgres)

 Mots de passe hashés (bcrypt/Argon2)

 Variables d’environnement sécurisées

 Accès DB limités (GRANT minimal)

✅ Performance

 Index sur toutes les Foreign Keys

 Index sur colonnes filtrées (status, role, payment_status)

 Pas d’index redondants (UNIQUE = index auto)

✅ Intégrité

 Contraintes UNIQUE sur email

 CHECK sur rating (1..5) et price (>=0)

 NOT NULL sur colonnes obligatoires

 Trigger updated_at sur toutes les tables

✅ Documentation

 Commentaires SQL sur tables/colonnes

 Diagramme ERD / Excalidraw

 Guide d’exécution (migrations → seeders → views)

🧠 Principe KISS appliqué à la DB

Keep It Simple, Stupid

✅ Faire simple
email CITEXT UNIQUE NOT NULL
price NUMERIC(10,2) NOT NULL CHECK (price >= 0)
❌ Over-engineering

Créer 15 tables “au cas où” sans besoin métier réel.

Quand complexifier ?

Besoin métier réel

Problème mesuré

Exigence sécurité (RGPD / audit)

Fin du guide ✅

Dernière mise à jour : 23/02/2026
```
