-- 02_seed_categories.sql

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    categories (
        id_category,
        name,
        description
    )
VALUES (
        uuidv7 (),
        U&'M\00E9nage',
        'Nettoyage et entretien'
    ),
    (
        uuidv7 (),
        'Jardinage',
        U&'Entretien des espaces verts'
    ),
    (
        uuidv7 (),
        'Plomberie',
        U&'Dépannage plomberie'
    ),
    (
        uuidv7 (),
        U&'Reparation',
        U&'Petits travaux et reparations'
    )
ON CONFLICT (name) DO NOTHING;