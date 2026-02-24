📚 Exercice : Refactoring Architecture MVC vers Architecture en Couches (HomeService)

🎯 Objectif

Refactoriser l'application HomeService pour séparer clairement les responsabilités :

**Validators** : Validation des données entrantes (Zod)
**Entities** : Représentation 1:1 des tables SQL
**Repositories** : Requêtes SQL pures
**Services** : Logique métier
**DTOs** : Formatage pour les vues
**Controllers** : Orchestration HTTP

🫣 Attention ! Mélanger SQL, logique métier et contrôleur, c’est la porte ouverte au chaos.
— Doki Doc

📊 Schéma de l'Architecture Cible
┌─────────────────────────────────────────────────────────────────┐
│ FLUX DE DONNÉES │
└─────────────────────────────────────────────────────────────────┘

HTTP Request (POST /bookings)
│
▼
┌──────────────────────┐
│ 1. VALIDATOR │ ◄── validators/bookingValidator.js
│ (Zod Schema) │ ✓ Valide les données entrantes
└──────────────────────┘ ✓ Retourne erreurs si invalide
│
▼
┌──────────────────────┐
│ 2. CONTROLLER │ ◄── controllers/BookingController.js
│ (Orchestration) │ ✓ Gère req/res HTTP
└──────────────────────┘ ✓ Appelle le Service
│
▼
┌──────────────────────┐
│ 3. SERVICE │ ◄── services/BookingService.js
│ (Logique Métier) │ ✓ Règles métier
└──────────────────────┘ ✓ Appelle le Repository
│
▼
┌──────────────────────┐
│ 4. REPOSITORY │ ◄── repositories/BookingRepository.js
│ (Requêtes SQL) │ ✓ SQL PostgreSQL
└──────────────────────┘ ✓ Retourne Entity
│
▼
┌──────────────────────┐
│ PostgreSQL │
│ (Table bookings) │
└──────────────────────┘
│
▼
┌──────────────────────┐
│ 5. ENTITY │ ◄── entities/BookingEntity.js
│ (Données brutes) │ ✓ Représentation 1:1 table
└──────────────────────┘ ✓ TOUS les champs
│
▼
┌──────────────────────┐
│ 6. DTO │ ◄── dto/BookingDTO.js
│ (Vue Frontend) │ ✓ Formatage pour EJS
└──────────────────────┘ ✓ Champs sélectionnés
│
▼
HTTP Response (HTML)

## 🔧 Étapes du Refactoring (Ressource : Booking)

## 📝 Étape 1 : Créer le Validator

📁 src/validators/bookingValidator.js

Règles de validation
Champ Type Règles
service_id uuid Obligatoire
booking_date date Obligatoire
booking_time string Format HH:MM
status enum pending, confirmed, completed, cancelled
import { z } from "zod";

export const createBookingSchema = z.object({
service_id: z.string().uuid("Service invalide"),

booking_date: z.coerce.date({
required_error: "La date est obligatoire",
}),

booking_time: z
.string({ required_error: "L'heure est obligatoire" })
.regex(/^\d{2}:\d{2}$/, "Format attendu HH:MM"),
});

export const updateBookingStatusSchema = z.object({
status: z.enum(
["pending", "confirmed", "completed", "cancelled"],
{ required_error: "Statut obligatoire" }
),
});
📝 Étape 2 : Créer l'Entity

📁 src/entities/BookingEntity.js

export class BookingEntity {
constructor(data) {
this.id_booking = data.id_booking;
this.client_id = data.client_id;
this.service_id = data.service_id;
this.booking_date = data.booking_date;
this.booking_time = data.booking_time;
this.status = data.status;
this.total_price = data.total_price;
this.created_at = data.created_at;
this.updated_at = data.updated_at;
}

static fromDatabase(row) {
return row ? new BookingEntity(row) : null;
}

static fromDatabaseList(rows) {
return rows.map((r) => new BookingEntity(r));
}
}
📝 Étape 3 : Créer le Repository

📁 src/repositories/BookingRepository.js

import pool from "../config/database.js";
import { BookingEntity } from "../entities/BookingEntity.js";

export class BookingRepository {
static async findAllByClient(clientId) {
const query = `       SELECT *
      FROM bookings
      WHERE client_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [clientId]);
    return BookingEntity.fromDatabaseList(result.rows);

}

static async findById(id, clientId) {
const query = `       SELECT *
      FROM bookings
      WHERE id_booking = $1
        AND client_id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [id, clientId]);
    return BookingEntity.fromDatabase(result.rows[0]);

}

static async create(data) {
const query = `       INSERT INTO bookings
      (id_booking, client_id, service_id, booking_date, booking_time, status, total_price)
      VALUES (uuidv7(), $1, $2, $3, $4, 'pending', $5)
      RETURNING *
    `;

    const values = [
      data.client_id,
      data.service_id,
      data.booking_date,
      data.booking_time,
      data.total_price,
    ];

    const result = await pool.query(query, values);
    return BookingEntity.fromDatabase(result.rows[0]);

}

static async updateStatus(id, status) {
const query = `       UPDATE bookings
      SET status = $2,
          updated_at = NOW()
      WHERE id_booking = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, status]);
    return BookingEntity.fromDatabase(result.rows[0]);

}

static async delete(id, clientId) {
const result = await pool.query(
`DELETE FROM bookings WHERE id_booking = $1 AND client_id = $2`,
[id, clientId]
);

    return result.rowCount === 1;

}
}
📝 Étape 4 : Créer le Service

📁 src/services/BookingService.js

Responsabilités :

Vérifier que le service existe

Récupérer son prix

Calculer total_price

Appliquer règles métier

import { BookingRepository } from "../repositories/BookingRepository.js";
import { ServiceRepository } from "../repositories/ServiceRepository.js";

export class BookingService {
static async getClientBookings(clientId) {
return await BookingRepository.findAllByClient(clientId);
}

static async getBookingById(id, clientId) {
return await BookingRepository.findById(id, clientId);
}

static async createBooking(data, clientId) {
const service = await ServiceRepository.findById(data.service_id);

    if (!service) return null;

    const bookingData = {
      client_id: clientId,
      service_id: data.service_id,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      total_price: service.price,
    };

    return await BookingRepository.create(bookingData);

}

static async updateBookingStatus(id, status) {
return await BookingRepository.updateStatus(id, status);
}

static async deleteBooking(id, clientId) {
return await BookingRepository.delete(id, clientId);
}
}
📝 Étape 5 : Créer le DTO

📁 src/dto/BookingDTO.js

export class BookingDTO {
constructor(entity) {
this.id = entity.id_booking;
this.date = entity.booking_date;
this.time = entity.booking_time;
this.status = entity.status;
this.total_price = entity.total_price;
this.created_at = entity.created_at;
}

static fromEntity(entity) {
return entity ? new BookingDTO(entity) : null;
}

static fromEntityList(entities) {
return entities.map((e) => new BookingDTO(e));
}

toCard() {
return {
id: this.id,
date: this.date,
time: this.time,
status: this.status,
total_price: this.total_price,
};
}

toDetail() {
return {
...this.toCard(),
created_at: this.created_at,
};
}
}
📝 Étape 6 : Refactoriser le Controller

📁 src/controllers/BookingController.js

import { BookingService } from "../services/BookingService.js";
import { BookingDTO } from "../dto/BookingDTO.js";
import {
createBookingSchema,
updateBookingStatusSchema,
} from "../validators/bookingValidator.js";

export class BookingController {
static async index(req, res, next) {
try {
const bookings = await BookingService.getClientBookings(
req.session.userId
);

      const dto = BookingDTO.fromEntityList(bookings)
        .map((b) => b.toCard());

      res.render("bookings/index", { bookings: dto });
    } catch (error) {
      next(error);
    }

}

static async store(req, res, next) {
try {
const parsed = createBookingSchema.parse(req.body);

      const booking = await BookingService.createBooking(
        parsed,
        req.session.userId
      );

      if (!booking) return res.status(404).render("errors/404");

      res.redirect(`/bookings/${booking.id_booking}`);
    } catch (error) {
      next(error);
    }

}

static async updateStatus(req, res, next) {
try {
const parsed = updateBookingStatusSchema.parse(req.body);

      await BookingService.updateBookingStatus(
        req.params.id,
        parsed.status
      );

      res.redirect(`/bookings/${req.params.id}`);
    } catch (error) {
      next(error);
    }

}

static async destroy(req, res, next) {
try {
await BookingService.deleteBooking(
req.params.id,
req.session.userId
);

      res.redirect("/bookings");
    } catch (error) {
      next(error);
    }

}
}
✅ Checklist HomeService
Validator

UUID validé

Enum status

Messages clairs

Entity

Tous champs DB

Aucune méthode SQL

Repository

SELECT propre

INSERT RETURNING

UPDATE RETURNING

DELETE sécurisé

Service

Récupère prix service

Calcule total_price

Vérifie existence

DTO

Formatage clair

Pas d’exposition inutile

Controller

Aucun SQL

Validation Zod

Service utilisé

DTO avant render

🎓 Critères d'évaluation
Critère Points
Validator /4
Entity /2
Repository /6
Service /4
DTO /2
Controller /2
Total /20
