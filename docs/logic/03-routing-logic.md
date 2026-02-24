# 🧭 Logique de Routage & Contrôleurs — HomeServices

Ce document explique comment l'utilisateur navigue dans l’application **HomeServices** et comment le backend répond aux requêtes.

Le projet repose sur l’architecture **MVC (Modèle – Vue – Contrôleur)** avec une organisation claire du routage.

---

## 📑 Sommaire

- 🍽️ Le MVC expliqué simplement
- 🏗️ Schéma du flux (Comment ça circule ?)
- 🛠️ Les actions standards (CRUD)
- 🛣️ Table des routes principales
- 🔒 Middlewares : Les points de contrôle

---

# 🍽️ Le MVC expliqué simplement

Utilisons la métaphore du **Restaurant** :

1. **Le Client (Navigateur)** → Tape une URL (`/services/123`)
2. **Le Routeur** → Oriente la demande vers le bon contrôleur
3. **Le Contrôleur** → Ordonne le travail
4. **Le Modèle / Repository** → Interagit avec la base PostgreSQL
5. **La Vue (EJS)** → Génère le HTML affiché

---

# 🏗️ Schéma du flux (Comment ça circule ?)

Exemple : un utilisateur consulte un service.

```text
      [ UTILISATEUR ]
            |
      (1) GET /services/12
            |
            v
        [ ROUTER ]
            |
      (2) → ServicesController.show
            |
            v
    [ SERVICES CONTROLLER ]
            |
      (3) Appelle Repository
            |
            v
    [ SERVICES REPOSITORY ]
            |
      (4) Requête SQL
            |
        [ POSTGRESQL ]
            |
      (5) Retour des données
            |
            v
    [ CONTROLLER ]
            |
      (6) res.render()
            |
            v
        [ VIEW EJS ]
            |
      (7) HTML généré
            |
            v
      [ UTILISATEUR ]
🛠️ Les actions standards (CRUD)

Pour garder une structure claire, nous utilisons des conventions REST.

Nom	Action	Signification
index	Liste	Afficher tous les éléments
show	Détails	Afficher un élément précis
create	Formulaire	Afficher le formulaire
store	Enregistrement	Créer en base
edit	Modifier (Vue)	Formulaire de modification
update	Modifier (Action)	Mettre à jour en base
destroy	Suppression	Supprimer
🛣️ Table des routes — HomeServices
🧾 Ressource : Services
Méthode	Route	Action	Vue
GET	/services	ServicesController.index	services/index.ejs
GET	/services/new	ServicesController.create	services/create.ejs
POST	/services	ServicesController.store	Redirection
GET	/services/:id	ServicesController.show	services/show.ejs
GET	/services/:id/edit	ServicesController.edit	services/edit.ejs
POST	/services/:id/update	ServicesController.update	Redirection
POST	/services/:id/delete	ServicesController.destroy	Redirection
📅 Ressource : Bookings
Méthode	Route	Action
GET	/bookings	index
GET	/bookings/:id	show
POST	/bookings	store
POST	/bookings/:id/delete	destroy
👤 Ressource : Users
Méthode	Route	Action
GET	/login	show login
POST	/login	authenticate
GET	/register	show register
POST	/register	create user
POST	/logout	logout
🔒 Middlewares : Les points de contrôle

Un middleware est un filtre exécuté avant le contrôleur.

Il sert à :

Vérifier l’authentification

Vérifier le rôle (admin / provider / client)

Valider les données avec Zod

Gérer les erreurs

Exemple concret
router.post(
  "/services",
  authMiddleware,
  validate(createServiceSchema),
  ServicesController.store
);

Ordre d’exécution :

Vérifie que l’utilisateur est connecté

Vérifie que les données sont valides

Exécute le contrôleur

🎯 Responsabilités claires
Composant	Rôle	Ne doit pas faire
Router	Associer URL → méthode	Écrire du SQL
Controller	Gérer req/res	Accéder directement à la DB
Repository	Exécuter SQL	Rendre une vue
View	Afficher HTML	Appeler la base de données
🏁 Conclusion

Le système de routage dans HomeServices :

Assure une navigation claire

Respecte les conventions REST

Sépare proprement les responsabilités

Facilite la maintenance et l’évolution du projet

Cette organisation est conforme aux standards professionnels utilisés en entreprise.

Dernière mise à jour : 24/02/2026
```
