# 🏗️ Architecture MVC & POO — HomeServices

Le projet **HomeServices** repose sur le pattern **MVC (Modèle – Vue – Contrôleur)** combiné à la **Programmation Orientée Objet (POO)**.

Cette architecture permet :

- Une séparation claire des responsabilités
- Un code maintenable et évolutif
- Une meilleure organisation du backend
- Une structure professionnelle adaptée aux projets réels

---

## 📑 Sommaire

- 💎 Pourquoi la POO ?
- 🧩 Les 3 piliers du MVC
- 📡 Flux de données (Schéma ANSI)
- 🛠️ Détail des responsabilités
- 🏗️ Exemple concret dans HomeServices

---

# 💎 Pourquoi la POO ?

Nous utilisons des **Classes ES6** pour structurer la logique métier.

### ✅ Organisation

Au lieu d’avoir des fonctions dispersées :

- `UserController`
- `ServiceController`
- `BookingController`
- `PaymentRepository`

Chaque entité métier est regroupée dans sa propre classe.

---

### ✅ Méthodes `static`

Nous utilisons principalement des méthodes `static`.

Exemple :

```js
export class ServiceRepository {
  static async findAll() {
    return await query("SELECT * FROM services");
  }
}

Utilisation :

const services = await ServiceRepository.findAll();

👉 Pas besoin d’instancier la classe avec new.

✅ Encapsulation

Chaque classe contient sa logique :

Le contrôleur ne sait pas comment la base fonctionne

Le repository ne sait pas comment la réponse HTTP est envoyée

La vue ne sait rien du SQL

🧩 Les 3 Piliers du MVC
1️⃣ Le Modèle (Model / Repository) — La Donnée

Le modèle est le seul composant qui communique avec PostgreSQL.

Rôle :

Exécuter les requêtes SQL

Retourner des données propres

Gérer la couche d’accès à la base

Emplacement :
src/repositories/
Exemple :

services.repository.js

2️⃣ La Vue (View) — L’Interface

La vue est ce que l’utilisateur voit.

Nous utilisons EJS pour générer du HTML côté serveur (SSR).

Rôle :

Afficher les données

Boucles simples

Conditions simples

Emplacement :
views/
Exemple :

views/pages/services/index.ejs

3️⃣ Le Contrôleur (Controller) — Le Cerveau

Le contrôleur fait le lien entre :

la requête HTTP

le modèle

la vue

Rôle :

Lire req

Appeler le modèle

Envoyer la réponse (res.render ou res.json)

Emplacement :
src/controllers/
📡 Flux de données (Schéma ANSI)

Voici le cycle complet d’une requête utilisateur :

        [ UTILISATEUR ]
              |
        (1) Requête HTTP
              |
              v
           [ ROUTER ]
              |
        (2) Appel Controller
              |
              v
      +--------------------+
      |    CONTROLLER      |
      +----------+---------+
                 |
        (3) Appel Repository
                 |
                 v
          [ REPOSITORY ]
                 |
        (4) Requête SQL
                 |
          [ POSTGRESQL ]
                 |
        (5) Données retournées
                 |
                 v
           [ CONTROLLER ]
                 |
        (6) Envoi vers la Vue
                 |
                 v
              [ EJS ]
                 |
        (7) HTML généré
                 |
                 v
          [ UTILISATEUR ]
🛠️ Détail des Responsabilités
Composant	Rôle principal	Ne doit JAMAIS faire
Routeur	Associer URL → méthode Controller	Contenir du SQL
Controller	Gérer req/res	Écrire des requêtes SQL
Repository	Exécuter le SQL	Faire des res.render()
Vue	Afficher HTML	Accéder à la base de données
🏗️ Exemple concret — HomeServices
Controller
// src/controllers/services.controller.js
import { ServiceRepository } from "../repositories/services.repository.js";

export class ServicesController {
  static async index(req, res) {
    const services = await ServiceRepository.findAll();
    res.render("pages/services/index", { services });
  }
}
Repository
// src/repositories/services.repository.js
import { query } from "../database/database.js";

export class ServiceRepository {
  static async findAll() {
    const sql = "SELECT * FROM services";
    const result = await query(sql);
    return result.rows;
  }
}
🎯 Pourquoi cette architecture est importante ?
✅ Lisibilité

On sait immédiatement où chercher.

✅ Maintenance

Si la base change → on modifié le Repository uniquement.

✅ Évolutivité

On peut ajouter :

Authentification

Middleware

Validation Zod
sans casser l’architecture.

✅ Professionnalisation

C’est une architecture utilisée en entreprise.

🏁 Conclusion

L’architecture MVC combinée à la POO permet dans HomeServices :

Une séparation claire des responsabilités

Une meilleure organisation du code

Une maintenance facilitée

Une structure évolutive et professionnelle

Elle constitue une base solide pour un projet backend structuré.

Dernière mise à jour : 24/02/2026
```
