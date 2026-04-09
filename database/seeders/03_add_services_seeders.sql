-- 03_seed_services.sql
-- Services de demonstration relies explicitement au prestataire
-- et aux categories pour faciliter la lecture du rapport.

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    services (
        id_service,
        provider_id,
        category_id,
        title,
        description,
        price,
        experience_years,
        trainings,
        has_driving_license,
        service_area,
        provider_status,
        created_at
    )
VALUES (
        '018d5c8e-3000-7001-b001-000000000001',
        '018d5c8e-1000-7001-9001-000000000003',
        '018d5c8e-2000-7001-a001-000000000001',
        U&'Service de m\00E9nage',
        U&'Prestation professionnelle de m\00E9nage a domicile.',
        45.00,
        4,
        'Formation hygiene et entretien des surfaces',
        FALSE,
        'Paris et petite couronne',
        'Artisan',
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-3000-7001-b001-000000000002',
        '018d5c8e-1000-7001-9001-000000000004',
        '018d5c8e-2000-7001-a001-000000000002',
        'Service de jardinage',
        'Entretien professionnel du jardin et des exterieurs.',
        55.00,
        6,
        'Formation entretien des espaces verts et taille saisonniere',
        TRUE,
        'Marseille et alentours',
        'Artisan',
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-3000-7001-b001-000000000003',
        '018d5c8e-1000-7001-9001-000000000005',
        '018d5c8e-2000-7001-a001-000000000003',
        'Service de plomberie',
        'Intervention pour depannage et petites reparations de plomberie.',
        70.00,
        8,
        'CAP installateur sanitaire et intervention de depannage',
        TRUE,
        'Marseille, Aix-en-Provence et alentours',
        'Artisan',
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-3000-7001-b001-000000000004',
        '018d5c8e-1000-7001-9001-000000000006',
        '018d5c8e-2000-7001-a001-000000000004',
        'Service de reparation',
        'Petits travaux de reparation a domicile.',
        50.00,
        5,
        'Formation bricolage, maintenance et petits travaux',
        TRUE,
        'Marseille centre et communes voisines',
        'Artisan',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id_service) DO UPDATE
SET
    provider_id = EXCLUDED.provider_id,
    category_id = EXCLUDED.category_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    experience_years = EXCLUDED.experience_years,
    trainings = EXCLUDED.trainings,
    has_driving_license = EXCLUDED.has_driving_license,
    service_area = EXCLUDED.service_area,
    provider_status = EXCLUDED.provider_status;
