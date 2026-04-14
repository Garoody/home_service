# 💎 Guide POO (Programmation Orientée Objet) — HomeServices

Dans le projet **HomeServices**, nous utilisons la **Programmation Orientée Objet (POO)** pour organiser le code de manière claire, maintenable et professionnelle.

Si tu débutes, vois la POO comme une manière de ranger ton code dans des "boîtes intelligentes" plutôt que d’avoir des fonctions dispersées partout.

---

## 📑 Sommaire

- 🏠 La métaphore de la Maison
- 🏗️ Classe vs Objet : le moule et le gâteau
- ⚡ Les méthodes `static`
- 🎯 Pourquoi on utilise la POO dans HomeServices ?
- 💡 Résumé simple

---

## 🏠 La métaphore de la Maison

Imagine que tu construis une ville.

- ❌ Sans POO :  
  Tu as une liste géante d’instructions en vrac :  
  “Créer un utilisateur”, “Vérifier un email”, “Mettre à jour un service”, etc.  
  Le code devient vite difficile à maintenir.

- ✅ Avec la POO :  
  Tu crées un plan appelé **Classe**.  
  Ce plan définit ce qu’est un **Utilisateur**, un **Service**, une **Réservation**, etc.

Ensuite, tu peux créer autant d’instances que tu veux à partir de ce plan.

---

## 🏗️ Classe vs Objet : Le moule et le gâteau

### 📌 Classe = le plan

### 📌 Objet = la chose réelle créée avec le plan

### Exemple simplifié :

```js
class User {
  constructor(full_name, email) {
    this.full_name = full_name;
    this.email = email;
  }

  sayHello() {
    return `Bonjour, je suis ${this.full_name}`;
  }
}

Création d’un objet :

const user1 = new User("Alice", "alice@mail.com");
console.log(user1.sayHello());
Schéma explicatif
      [ CLASSE User ]
     (le plan)
    +------------------+
    | full_name        |
    | email            |
    | sayHello()       |
    +------------------+
            |
            | new
            v
    [ OBJET user1 ]
    +------------------+
    | "Alice"          |
    | "alice@mail.com" |
    +------------------+

On écrit la classe une seule fois.
On peut créer des milliers d’objets.

⚡ Les méthodes static

Dans notre projet, on utilise souvent des méthodes static.

📌 Méthode Static = outil global

Accessible directement via la classe :

class User {
  static async findAll() {
    return await query("SELECT * FROM users");
  }
}

Utilisation :

const users = await User.findAll();

👉 On n’a pas besoin de créer un objet new User().

📌 Méthode d’instance = action propre à un objet
const user = new User("Bob", "bob@mail.com");
user.sayHello();
Différence visuelle
User.findAll()     → méthode static (globale)
user.sayHello()    → méthode d’instance
🎯 Pourquoi on utilise la POO dans HomeServices ?
1️⃣ Organisation claire

Dans HomeServices :

User → gestion des utilisateurs

Service → gestion des services

Booking → gestion des réservations

Payment → gestion des paiements

Chaque entité a son propre fichier.

2️⃣ Séparation des responsabilités

Architecture utilisée :

Controller → reçoit la requête HTTP

Repository / Model → parle à la base de données

Service Layer (si présent) → logique métier

La POO permet de garder chaque responsabilité dans une structure propre.

3️⃣ Maintenance facilitée

Si demain on change :

le nom d’une colonne en base

la logique de calcul d’un prix

le comportement d’un utilisateur

On modifié uniquement la classe concernée.

4️⃣ Auto-complétion dans VS Code

Quand tu tapes :

User.

VS Code te propose automatiquement :

findAll

findById

create

update

Gain de temps + moins d’erreurs.

🧠 Exemple concret dans HomeServices
// services.repository.js
export class ServiceRepository {
  static async findByCategory(categoryId) {
    const sql = `
      SELECT *
      FROM services
      WHERE category_id = $1
    `;
    return await query(sql, [categoryId]);
  }
}

Dans le controller :

const services = await ServiceRepository.findByCategory(id);
💡 Résumé pour le débutant
Terme	Traduction simple	Exemple
Classe	Un plan ou un moule	class User {}
Objet	Une instance créée à partir du plan	new User()
Méthode	Une action dans la classe	findAll()
Static	Méthode globale	User.findAll()
🏁 Conclusion

La POO permet dans HomeServices :

une meilleure organisation

une séparation claire des responsabilités

une maintenance plus simple

un code plus professionnel

Elle est essentielle pour travailler sur des projets backend structurés.

Dernière mise à jour : 24/02/2026
```
