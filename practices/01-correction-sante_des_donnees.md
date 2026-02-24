🟢 Correction : Phase 1 — Inspection de Santé (HomeServices)
📄 Fichier : 01_get_recent_users.sql

🎯 L'enjeu : Vérifier l’activité récente des utilisateurs.

SELECT
full_name,
email,
role,
created_at
FROM users
ORDER BY created_at DESC;

Note pédagogique :
On utilise DESC (Descending) pour afficher les dates les plus récentes en premier.
Cela permet d’identifier rapidement les dernières inscriptions.

📄 Fichier : 02_find_expensive_services.sql

🎯 L'enjeu : Filtrer des données numériques.

SELECT
title,
price
FROM services
WHERE price > 50;

Note pédagogique :
Ici on filtre sur une colonne numeric.
SQL compare directement les valeurs numériques sans conversion.
C’est plus performant qu’un filtre sur du texte.

📄 Fichier : 03_check_pending_bookings.sql

🎯 L'enjeu : Filtrer sur un ENUM.

SELECT
id_booking,
booking_date,
status
FROM bookings
WHERE status = 'pending';

Note pédagogique :

status est un type ENUM (booking_status_enum).

PostgreSQL est strict : la valeur doit correspondre exactement à celle définie dans le type.

Les ENUM garantissent l’intégrité des données.

📄 Fichier : 04_get_unpaid_payments.sql

🎯 L'enjeu : Identifier les paiements non validés.

SELECT
id_payment,
amount,
payment_status,
payment_date
FROM payments
WHERE payment_status = 'pending';

Note pédagogique :
Cette requête est essentielle pour le suivi financier.
Elle permet de détecter les réservations qui n’ont pas encore été payées.

📄 Fichier : 05_check_low_ratings.sql

🎯 L'enjeu : Contrôler la qualité des prestations.

SELECT
provider_id,
rating,
comment
FROM reviews
WHERE rating <= 2;

Note pédagogique :
La colonne rating possède une contrainte :

CHECK (rating BETWEEN 1 AND 5)

Cela garantit qu’aucune note invalide ne peut être insérée.

🧠 Ce qu’il faut retenir avant de passer aux jointures

1️⃣ Les ENUM sécurisent les états métier
Exemple : pending, confirmed, completed.

2️⃣ Les types numériques sont performants
Toujours stocker un prix en numeric, jamais en varchar.

3️⃣ ORDER BY est essentiel pour l’analyse
Pour voir les dernières inscriptions, réservations ou paiements.

4️⃣ Les contraintes SQL protègent tes données
CHECK, UNIQUE, FOREIGN KEY = sécurité structurelle.

🚀 Prochaine étape : Les Jointures (Phase 2)

Maintenant que tu sais analyser une table seule, on va relier les données :

🔗 Afficher le nom du client pour chaque réservation

🔗 Afficher le prestataire derrière un service

🔗 Voir les paiements liés aux réservations

🔗 Calculer le chiffre d’affaires par prestataire

C’est avec les INNER JOIN et LEFT JOIN que ton application devient vraiment intelligente.
