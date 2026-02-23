# 🛡️ Validation avec Zod — HomeServices API

Nous appliquons le principe du **"Zero Trust"** :  
aucune donnée provenant du client (`req.body`, `req.params`, `req.query`) n'est utilisée sans validation préalable via **Zod**.

---

## 📑 Sommaire

- [📦 Installation](#-installation)
- [🚀 Pourquoi Zod dans notre API ?](#-pourquoi-zod-dans-notre-api-)
- [📂 Organisation](#-organisation)
- [📝 1. Définition d'un Schéma](#-1-définition-dun-schéma)
- [⚙️ 2. Middleware de Validation](#-2-middleware-de-validation)
- [🔗 3. Utilisation dans les Routes](#-3-utilisation-dans-les-routes)
- [🔄 Flux de validation (API REST)](#-flux-de-validation-api-rest)
- [💡 Astuce : z.coerce & z.enum](#-astuce--zcoerce--zenum)

---

## 📦 Installation

Pour ajouter Zod au projet :

```bash
npm install zod
🚀 Pourquoi Zod dans notre API ?
🔐 Sécurité

Empêche les injections inattendues

Refuse les formats invalides (UUID, email, etc.)

Protège contre les données malformées

📏 Contrat de Données

Garantit que les données envoyées au Repository sont propres

Transforme automatiquement les types si nécessaire

🧼 Simplification

Les contrôleurs ne vérifient plus chaque champ

Les erreurs sont uniformisées

📂 Organisation
src/
  validation/
    schemas/
      user.schema.js
      service.schema.js
      booking.schema.js
  middlewares/
    validate.js
📝 1. Définition d’un Schéma
Exemple : Création d’un Service
// src/validation/schemas/service.schema.js
import { z } from "zod";

export const createServiceSchema = z.object({
  provider_id: z.string().uuid("UUID provider invalide"),
  category_id: z.string().uuid("UUID catégorie invalide"),
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(150, "Titre trop long"),
  description: z.string().trim().min(5),
  price: z.coerce
    .number()
    .positive("Le prix doit être un nombre positif"),
});
Exemple : Création d’un Booking
// src/validation/schemas/booking.schema.js
import { z } from "zod";

export const createBookingSchema = z.object({
  client_id: z.string().uuid(),
  service_id: z.string().uuid(),
  booking_date: z.string().min(10),
  booking_time: z.string().min(5),
});
⚙️ 2. Middleware de Validation

Middleware générique qui valide n’importe quel schéma.

// src/middlewares/validate.js
import { AppError } from "../errors/AppError.js";

export const validate = (schema, source = "body") => (req, res, next) => {
  const dataToValidate = req[source];

  const result = schema.safeParse(dataToValidate);

  if (!result.success) {
    const firstError = result.error.issues[0];

    throw new AppError({
      message: firstError.message,
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }

  // Remplacement par données nettoyées
  req[source] = result.data;
  next();
};
🔗 3. Utilisation dans les Routes

Le middleware validate se place AVANT le contrôleur.

// src/routes/services.routes.js
import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { createServiceSchema } from "../validation/schemas/service.schema.js";
import * as servicesController from "../controllers/services.controller.js";

const router = Router();

router.post(
  "/services",
  validate(createServiceSchema),
  servicesController.create
);

export default router;
🔄 Flux de validation (API REST)
       [ CLIENT / FRONTEND ]
                 |
          ( POST /services )
                 v
    +--------------------------+
    |  Middleware VALIDATE     |
    +------------+-------------+
                 |
          _______|_______
         |               |
      [ÉCHEC]         [SUCCÈS]
         |               |
         v               v
   throw AppError   req.body = data propre
         |               |
         v               v
   EXPRESS 5        [ CONTROLLER ]
  (Capture erreur)         |
         |                 v
         v           [ REPOSITORY ]
   [ ERROR HANDLER ]        |
         |                 v
         v           Réponse JSON
   JSON 400 error
📦 Format JSON en cas d’erreur
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le titre doit contenir au moins 3 caractères"
  }
}
💡 Astuce : z.coerce & z.enum
z.coerce

Transforme automatiquement un texte en nombre.

price: z.coerce.number()

Très utile car les formulaires envoient souvent des strings.

z.enum (adapté à HomeServices)

Pour ton enum role_enum :

role: z.enum(["client", "provider", "admin"])
🧠 Bonnes pratiques HomeServices

Toujours valider req.params pour les UUID

Toujours valider req.body avant insertion DB

Centraliser tous les schémas dans validation/schemas

Ne jamais faire confiance au frontend

Dernière mise à jour : 23/02/2026
```
