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










1.1 Présentation et contextualisation du projet
Le projet HomeServices a été réalisé dans le cadre de ma formation Développeur Web et Web Mobile à l’AFPA. Il s’agit d’une application web de mise en relation entre des clients et des prestataires de services à domicile.

L’objectif du projet est de proposer une solution numérique simple, claire et fonctionnelle permettant à un utilisateur de consulter des services, réserver une prestation, effectuer un paiement simplifié et laisser un avis après réalisation du service. Le projet permet également à un prestataire de publier ses services, gérer son activité et consulter les demandes reçues. Un espace administrateur est aussi prévu pour assurer la surveillance et la modération de la plateforme.

Ce projet s’inscrit dans une logique professionnalisante, car il m’a permis de travailler sur l’ensemble des étapes de conception et de développement d’une application web dynamique, depuis la modélisation de la base de données jusqu’à la réalisation du front-end et du back-end.

1.1.1 Les objectifs du projet
L’objectif principal du projet est de développer une application web complète de réservation de services à domicile.

Les objectifs secondaires sont les suivants :

mettre en place un environnement de développement adapté
concevoir une architecture applicative claire
développer une base de données relationnelle cohérente
différencier les rôles client, prestataire et administrateur
permettre la publication et la consultation de services
permettre la réservation d’une prestation
intégrer un système de paiement simplifié
permettre la gestion des avis
intégrer une logique de sécurité et de modération
produire une interface moderne, responsive et ergonomique
1.1.2 Le périmètre du projet
Le périmètre du projet couvre :

l’inscription et la connexion des utilisateurs
la gestion des rôles
la publication et la gestion de services
la consultation des services par catégorie
la réservation de prestations
la gestion simplifiée des paiements
le dépôt d’avis après prestation
le tableau de bord client
le tableau de bord prestataire
l’espace administrateur de modération
Le projet ne couvre pas :

une application mobile native
une messagerie instantanée entre utilisateurs
un système bancaire complet de versement réel au prestataire
une solution de paiement marketplace totalement intégrée
1.2 Graphisme et ergonomie
Le graphisme et l’ergonomie occupent une place importante dans le projet, car l’application doit être simple à utiliser pour plusieurs profils d’utilisateurs. L’interface a été pensée pour rester claire, moderne et professionnelle, tout en facilitant la navigation.

L’organisation des pages a été conçue pour permettre un accès rapide aux fonctionnalités principales. Les tableaux de bord sont différenciés selon le rôle de l’utilisateur, afin que le client, le prestataire et l’administrateur aient chacun une interface adaptée à leurs besoins.

Une attention particulière a également été portée à la lisibilité des contenus, à la cohérence des couleurs, au positionnement des boutons d’action et à l’organisation générale des formulaires, des cartes de services et des zones de navigation.

1.2.1 La charte graphique
La charte graphique du projet repose sur une identité visuelle sobre et cohérente.

Les principaux choix graphiques concernent :

l’utilisation de tons sombres pour le fond et les zones principales
l’utilisation du bleu pour mettre en valeur les actions importantes
l’utilisation du vert pour les paiements, validations et statuts positifs
l’utilisation du rouge pour les erreurs et actions sensibles
une hiérarchie visuelle claire entre titres, sous-titres et contenus
Le choix des polices s’inscrit dans une logique de lisibilité et de simplicité. Une police sans serif moderne de type Roboto convient bien à ce projet, car elle offre un rendu propre, lisible et professionnel sur les différents écrans.

Le logo et les éléments visuels ont également été pensés pour renforcer l’identité du projet et assurer une cohérence entre la navigation, les tableaux de bord et le pied de page.

1.3 Spécifications fonctionnelles
Les spécifications fonctionnelles décrivent les fonctionnalités que l’application doit proposer aux différents utilisateurs.

Le projet doit permettre à chaque rôle d’accéder à un ensemble d’actions adapté. Le client doit pouvoir consulter des services, réserver, payer et laisser un avis. Le prestataire doit pouvoir publier des services, gérer son profil et suivre son activité. L’administrateur doit pouvoir modérer la plateforme et intervenir en cas de problème.

1.3.1 Périmètre fonctionnel
Le périmètre fonctionnel du projet comprend :

la gestion des comptes utilisateurs
la gestion des rôles
la gestion des services
la gestion des réservations
la gestion des paiements
la gestion des avis
la gestion du profil prestataire
la modération administrateur
1.3.2 Front Office
Le front office correspond à la partie visible par les utilisateurs de la plateforme.

Il comprend notamment :

la page d’accueil
la consultation des services
la fiche détaillée d’un service
la réservation
le paiement
l’espace client
l’espace prestataire
Le front office a été conçu pour être intuitif, lisible et responsive.

1.3.3 Back Office
Le back office correspond à l’espace administrateur.

Il permet :

de consulter les utilisateurs
d’accéder aux profils
de consulter les services
de consulter les réservations
de consulter les avis
de gérer les signalements
d’envoyer des avertissements
de suspendre ou bannir des comptes si nécessaire
Le rôle de l’administrateur est de superviser et modérer la plateforme, et non de valider les contenus avant leur publication.

1.3.4 L’arborescence
Le projet est structuré de manière à séparer clairement les responsabilités.

L’arborescence principale comprend :

src pour le code source de l’application
public pour les fichiers statiques
src/routes pour les routes
src/controllers pour la logique de contrôle
src/services pour la logique métier
src/repositories pour l’accès aux données
src/views pour les vues EJS
database/migrations pour la structure de la base
database/seeders pour les données de démonstration
tests pour les tests
Cette organisation permet d’améliorer la lisibilité, la maintenance et l’évolution du projet.

1.4 Contraintes
Le projet est soumis à plusieurs contraintes, aussi bien fonctionnelles que techniques. Ces contraintes concernent la structure de l’application, la sécurité, la cohérence des données et la clarté de l’interface.

Il était nécessaire de développer une application fiable, maintenable et cohérente, tout en respectant les exigences d’un projet professionnalisant dans le cadre de la formation.

1.4.1 Contraintes techniques
Les principales contraintes techniques sont les suivantes :

séparer la logique front-end et back-end
structurer l’application de manière claire
utiliser une base de données relationnelle
assurer la cohérence des relations entre les tables
sécuriser les formulaires et les accès
gérer les rôles utilisateurs
proposer une interface responsive
maintenir un code propre et évolutif
1.5 Spécifications techniques
Les spécifications techniques présentent les technologies, outils et choix de développement retenus pour concevoir l’application.

Le projet a été développé dans un environnement web moderne, avec une séparation claire entre l’interface utilisateur, la logique métier et l’accès aux données.

1.5.1 Les choix technologiques
Les principales technologies utilisées dans le projet sont :

Node.js pour l’environnement d’exécution côté serveur
Express.js pour la structure de l’application et la gestion des routes
EJS pour le rendu dynamique des pages côté serveur
JavaScript pour le développement global du projet
PostgreSQL pour la base de données relationnelle
SQL pour les requêtes, migrations et seeders
Tailwind CSS pour la mise en forme de l’interface
Zod pour la validation des données
Express Session pour la gestion des sessions
Passport.js pour l’authentification
Git et GitHub pour le versionnement
Ces choix technologiques ont été retenus car ils permettent de construire une application complète, structurée, cohérente et adaptée aux attentes d’un projet réalisé dans le cadre de la formation DWWM.