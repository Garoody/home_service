-- 02_seed_categories.sql
-- Categories de demonstration avec identifiants stables.

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    categories (
        id_category,
        name,
        description
    )
VALUES (
        '018d5c8e-2000-7001-a001-000000000001',
        U&'M\00E9nage',
        'Nettoyage et entretien'
    ),
    (
        '018d5c8e-2000-7001-a001-000000000002',
        'Jardinage',
        'Entretien des espaces verts'
    ),
    (
        '018d5c8e-2000-7001-a001-000000000003',
        'Plomberie',
        'Depannage plomberie'
    ),
    (
        '018d5c8e-2000-7001-a001-000000000004',
        'Reparation',
        'Petits travaux et reparations'
    )
ON CONFLICT (name) DO UPDATE
SET
    description = EXCLUDED.description;

INSERT INTO
    categories (
        id_category,
        name,
        description
    )
VALUES (
        '018d5c8e-2000-7001-a001-000000000005',
        'Bricolage',
        'Nettoyage et entretien'
    )