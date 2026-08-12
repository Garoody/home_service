-- 01_seed_users.sql
-- Donnees utilisateurs de demonstration avec identifiants fixes
-- pour rendre les relations plus faciles a lire dans les seeders suivants.

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    users (
        id_user,
        first_name,
        last_name,
        full_name,
        email,
        password_hash,
        phone,
        address,
        role,
        provider_status,
        gdpr_consent,
        gdpr_consent_date
    )
VALUES (
        '018d5c8e-1000-7001-9001-000000000001',
        'Admin',
        'HomeServices',
        'Admin HomeServices',
        'admin@homeservices.local',
        crypt ('Admin123!', gen_salt ('bf')),
        '0600000000',
        'Paris',
        'admin',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP
    ),
   
    (
        '018d5c8e-1000-7001-9001-000000000002',
        'Client',
        'Test',
        'Client Test',
        'client@homeservices.local',
        crypt ('Client123!', gen_salt ('bf')),
        '0611111111',
        'Lyon',
        'client',
        NULL,
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-1000-7001-9001-000000000003',
        'Sagine',
        'Demo',
        'Sagine Demo',
        'provider@homeservices.local',
        crypt (
            'Provider123!',
            gen_salt ('bf')
        ),
        '0622222222',
        'Marseille',
        'provider',
        'Artisan',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-1000-7001-9001-000000000004',
        'Lauryne',
        'Demo',
        'Lauryne Demo',
        'lauryne@homeservices.local',
        crypt (
            'Provider123!',
            gen_salt ('bf')
        ),
        '0633333333',
        'Lille',
        'provider',
        'Artisan',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-1000-7001-9001-000000000005',
        'Nath',
        'Demo',
        'Nath Demo',
        'narth@homeservices.local',
        crypt (
            'Provider123!',
            gen_salt ('bf')
        ),
        '0644444444',
        'Bordeaux',
        'provider',
        'Artisan',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-1000-7001-9001-000000000006',
        'Camille',
        'Demo',
        'Camille Demo',
        'camille@homeservices.local',
        crypt (
            'Provider123!',
            gen_salt ('bf')
        ),
        '0655555555',
        'Toulouse',
        'provider',
        'Artisan',
        TRUE,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO
UPDATE
SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    role = EXCLUDED.role,
    provider_status = EXCLUDED.provider_status,
    gdpr_consent = EXCLUDED.gdpr_consent,
    gdpr_consent_date = EXCLUDED.gdpr_consent_date;
