-- 02_seed_categories.sql

INSERT INTO
    categories (
        id_category,
        name,
        description
    )
VALUES (
        uuidv7 (),
        'Ménage',
        'Nettoyage et entretien'
    ),
    (
        uuidv7 (),
        'Jardinage',
        'Entretien des espaces verts'
    ),
    (
        uuidv7 (),
        'Plomberie',
        'Dépannage plomberie'
    ),
    (
        uuidv7 (),
        'Réparation',
        'Petits travaux et réparations'
    )
ON CONFLICT (name) DO NOTHING;