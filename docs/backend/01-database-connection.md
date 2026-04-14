# 🔌 Connexion PostgreSQL (Client) — HomeServices

Ce document explique comment notre application **HomeServices** communique avec la base de données **PostgreSQL**.

## ❓ C'est quoi le "Client" ?

Dans le monde de **Node.js** et **PostgreSQL**, le **Client** (via le driver `pg`) est l’interprète.

- Il fait le pont entre le **JavaScript** (ton code) et le **SQL** (la base de données).
- Son rôle : ouvrir un canal de communication, envoyer la requête au serveur Postgres, puis récupérer le résultat (souvent sous forme d’objet/array JSON).

## 🏗️ Schéma de Fonctionnement

```text
[ APPLICATION ]   <-- "Donne-moi les services de la catégorie X" (JavaScript)
      |
      v
[   CLIENT / POOL  ]   <-- Traduit + envoie la requête SQL
      |
      v
[  POSTGRESQL  ]   <-- Exécute : SELECT ... FROM services ...
      |
      v
[   CLIENT / POOL  ]   <-- Retourne result.rows
      |
      v
[ APPLICATION ]   <-- Réponse JSON au frontend
🛠️ Pourquoi utiliser un "Pool" plutôt qu'un "Client" seul ?

On pourrait créer un seul Client, mais on utilise un Pool (une "piscine" de clients) pour l’efficacité :

Client unique : si plusieurs utilisateurs font une requête en même temps, ils doivent attendre (file d’attente).

Pool (Notre choix) : garde plusieurs connexions ouvertes. Si un client est occupé, le pool en fournit un autre.

                    [ GESTIONNAIRE DE POOL ]
                   /           |            \
            [Client 1]    [Client 2]    [Client 3]
               |             |             |
               v             v             v
            [        BASE DE DONNÉES         ]
⚙️ Pré-requis
Installation du driver PostgreSQL
npm i pg
Variables d’environnement (.env)

Le Pool peut lire automatiquement ces variables :

PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=service_db_dev
⚙️ Configuration du Code

Fichier : src/database/database.js

import pg from "pg";

const { Pool } = pg;

// Le Pool utilise automatiquement ton fichier .env si les variables sont présentes :
// PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
export const pool = new Pool();

// Événement déclenché quand un nouveau client est créé dans le pool
pool.on("connect", () => {
  console.log("🐘 Nouveau client connecté au Pool (HomeServices)");
});

pool.on("error", (err) => {
  console.error("⚠️ Erreur inattendue d'un client du Pool", err);
});

// Fonction helper (optionnelle) pour centraliser les requêtes
export async function query(sql, values = []) {
  return pool.query(sql, values);
}
✅ Exemple d’utilisation (Query)

Exemple : récupérer les services avec le prestataire et la catégorie.

import { query } from "../database/database.js";

export async function getServicesWithProvider() {
  const sql = `
    SELECT
      s.id_service,
      s.title,
      s.price,
      c.name AS category_name,
      u.full_name AS provider_name
    FROM services s
    JOIN catégories c ON c.id_category = s.category_id
    JOIN users u ON u.id_user = s.provider_id
    ORDER BY s.created_at DESC
    LIMIT 20;
  `;

  const result = await query(sql);
  return result.rows;
}
🔒 Sécurité : Requêtes Paramétrées

Le client pg protège contre les injections SQL si tu utilises des paramètres ($1, $2…).

// ✅ SÉCURISÉ : le client sépare SQL et données
const sql = "SELECT * FROM services WHERE category_id = $1";
const values = [categoryId]; // categoryId doit être un UUID valide
const result = await pool.query(sql, values);

// ❌ DANGEREUX : injection SQL possible
const sqlBad = `SELECT * FROM services WHERE category_id = '${categoryId}'`;
🧠 Bonnes pratiques (HomeServices)

Garder les requêtes SQL dans repositories/ ou database/queries/

Ne jamais logguer le mot de passe ou les secrets .env

Utiliser un Pool unique pour toute l’application

Toujours utiliser $1, $2… dans le backend

Dernière mise à jour : 23/02/2026
```
