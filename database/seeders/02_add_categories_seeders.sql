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
        U&'D\00E9pannage plomberie'
    ),
    (
        uuidv7 (),
        U&'R\00E9paration',
        U&'Petits travaux et r\00E9parations'
    )
ON CONFLICT (name) DO NOTHING;
