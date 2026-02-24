# 🎨 Architecture Frontend (EJS & Assets) — HomeServices

Ce document décrit l’organisation des vues et la gestion des fichiers statiques pour le rendu côté serveur (**SSR**) avec **EJS** dans le projet **HomeServices**.

---

## 📌 Sommaire

1. [📂 Structure des dossiers](#1-structure-des-dossiers)
2. [🏗️ Système de Layout (ejs-mate)](#2-système-de-layout-ejs-mate)
3. [🧩 Composants réutilisables (Partials)](#3-composants-réutilisables-partials)
4. [🖼️ Gestion des Assets (Public)](#4-gestion-des-fichiers-statiques-assets)
5. [💡 Bonnes pratiques EJS](#5-bonnes-pratiques-ejs)

---

## 1. Structure des dossiers

On utilise une séparation claire entre :

- le layout global (squelette HTML)
- les partials réutilisables (navbar, footer…)
- les pages spécifiques à chaque route

```text
views/
├── layouts/                 # Layouts globaux (head, body, structure)
│   └── main.ejs             # Layout principal
├── partials/                # Fragments réutilisables
│   ├── head.ejs             # Meta + CSS (dans <head>)
│   ├── navbar.ejs           # Navigation
│   ├── footer.ejs           # Footer + scripts
│   └── flash.ejs            # Messages (optionnel)
└── pages/                   # Pages complètes par fonctionnalité
    ├── home.ejs             # Page d'accueil
    ├── auth/                # Connexion / inscription
    │   ├── login.ejs
    │   └── register.ejs
    ├── services/            # Services (liste, détail, création)
    │   ├── index.ejs
    │   ├── show.ejs
    │   └── create.ejs
    ├── bookings/            # Réservations (liste, détail)
    │   ├── index.ejs
    │   └── show.ejs
    └── dashboard/           # Tableau de bord (client/provider/admin)
        ├── client.ejs
        ├── provider.ejs
        └── admin.ejs
2. Système de Layout (ejs-mate)

Pour éviter la duplication, on utilise ejs-mate.

Le fichier main.ejs joue le rôle de “coquille” :

head commun

navbar

footer

zone d’injection de contenu

Fichier : views/layouts/main.ejs
<!DOCTYPE html>
<html lang="fr">
  <head>
    <%- include("../partials/head") %>
  </head>

  <body>
    <%- include("../partials/navbar") %>

    <main class="container">
      <%- include("../partials/flash") %>
      <%- body -%>
      <!-- Ici sera injecté le contenu de la page -->
    </main>

    <%- include("../partials/footer") %>
  </body>
</html>
3. Composants réutilisables (Partials)

Les partials sont des fragments HTML réutilisables (header, navbar, footer…).

✅ Passer des données à un partial
<%- include("../partials/button", { label: "Réserver" }) %>
Exemple : views/partials/button.ejs
<button class="btn">
  <%= label %>
</button>
4. Gestion des fichiers statiques (Assets)

Le dossier public/ est le seul dossier accessible directement par le navigateur.

Structure recommandée
public/
├── css/
│   └── style.css
├── js/
│   └── main.js
└── images/
    ├── logo.svg
    └── banner.jpg
Configuration Express

Dans app.js, on déclare le dossier statique en chemin absolu (évite les bugs selon l’endroit où on lance le serveur) :

import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
5. Bonnes pratiques EJS
❌ À ne pas faire

Faire des requêtes SQL dans le .ejs

Mettre de la logique métier complexe dans la vue

<!-- MAUVAIS -->
<% const result = await pool.query("SELECT * FROM services") %>
✅ À faire

Préparer toutes les données dans le contrôleur et n’utiliser EJS que pour :

afficher des valeurs

boucler simplement

conditions simples

// Controller
res.render("pages/services/index", {
  title: "Services",
  services: rows,
});
🔐 Échappement de sécurité (XSS)

<%= variable %> : échappe automatiquement → à utiliser par défaut

<%- variable %> : n’échappe pas → uniquement pour HTML sûr (partials)

Exemples :

<!-- ✅ Safe -->
<p><%= service.title %></p>

<!-- ⚠️ Unescaped (à éviter sauf HTML safe) -->
<div><%- htmlContent %></div>

Dernière mise à jour : 23/02/2026
```
