# 🚨 Gestion des Erreurs & Asynchronisme (Architecture API REST)

Ce document détaille comment l'application **HomeServices** capture les erreurs à travers les différentes couches (Repository → Service → Controller) et renvoie des réponses JSON cohérentes (404, 400, 500).

---

## 🧠 Qu'est-ce qu'un Middleware ?

Un **Middleware** est une fonction intermédiaire qui s’exécute entre la réception de la requête HTTP et l’envoi de la réponse.

Dans notre architecture :

1. **Routeur** : reçoit la requête `/services/123`
2. **Controller** : orchestre l’action
3. **Service** : applique la logique métier
4. **Repository** : exécute le SQL
5. **Middleware d’erreur** : capture toute erreur levée (`throw`)

```text
[NAVIGATEUR / CLIENT API]
          |
          v
       [ROUTE]
          |
          v
     [CONTROLLER]
          |
          v
        [SERVICE]
          |
          v
      [REPOSITORY]
          |
      (ERREUR SQL / MÉTIER)
          v
[ MIDDLEWARE D'ERREUR CENTRALISÉ ]
          |
          v
    Réponse JSON 404 / 500
⚡ Express 5 & Asynchrone

Avec Express 5, la gestion des erreurs async est native :

Pas besoin de try/catch partout

Si une erreur est levée dans un await, Express la transmet automatiquement au middleware d’erreur

Exemple :

const service = await servicesRepository.findById(id);

Si la requête SQL échoue → le middleware la récupère.

🏗️ Implémentation POO (HomeServices)
1️⃣ Classe d’erreur personnalisée : AppError

Permet de créer des erreurs propres avec code HTTP.

src/errors/AppError.js
export class AppError extends Error {
  constructor({ message, status = 400, code = "APP_ERROR" }) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}
2️⃣ Repository (exemple Service)

Le repository interagit avec la base.

// src/repositories/services.repository.js
import { query } from "../database/database.js";

export async function findById(id) {
  const sql = "SELECT * FROM services WHERE id_service = $1";
  const result = await query(sql, [id]);
  return result.rows[0];
}

Si l’UUID est invalide → PostgreSQL renvoie une erreur 22P02.

3️⃣ Controller

Le controller vérifie si la donnée existe.

// src/controllers/services.controller.js
import * as servicesRepository from "../repositories/services.repository.js";
import { AppError } from "../errors/AppError.js";

export async function show(req, res) {
  const { id } = req.params;

  const service = await servicesRepository.findById(id);

  if (!service) {
    throw new AppError({
      message: "Service introuvable",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  res.json(service);
}

Si le service n'existe pas → 404.

4️⃣ Middleware d’erreur centralisé

Déclaré en dernier dans app.js.

src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  console.error(`❌ [${err.name}] : ${err.message}`);

  // Gestion erreurs PostgreSQL
  if (err.code === "23505") {
    return res.status(409).json({
      error: {
        code: "DUPLICATE",
        message: "Donnée déjà existante."
      }
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: {
        code: "FOREIGN_KEY_ERROR",
        message: "Référence invalide."
      }
    });
  }

  if (err.code === "22P02") {
    return res.status(400).json({
      error: {
        code: "INVALID_UUID",
        message: "Format UUID invalide."
      }
    });
  }

  // Erreur custom AppError
  if (err.status && err.code) {
    return res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Erreur interne
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erreur interne du serveur."
    }
  });
};
🛡️ Gestion des erreurs courantes (HomeServices)
Erreur	Source	Résultat API
Service introuvable	Controller	404
UUID invalide	PostgreSQL	400
Email déjà utilisé	PostgreSQL (23505)	409
FK inexistante	PostgreSQL (23503)	400
Crash DB	Pool	500
📦 Format JSON retourné

Exemple :

{
  "error": {
    "code": "NOT_FOUND",
    "message": "Service introuvable"
  }
}
🧠 Bonnes pratiques

Une seule gestion d’erreur globale

Ne jamais exposer stack en production

Logger les erreurs côté serveur

Utiliser AppError pour les erreurs métier

Laisser PostgreSQL gérer les contraintes (UNIQUE, FK)

Dernière mise à jour : 23/02/2026
```
