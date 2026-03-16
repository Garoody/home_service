-- 01_seed_users.sql
-- Crée 1 admin + 2 customers (dont 1 servira de "provider")

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    users (
        id_user,
        full_name,
        email,
        password_hash,
        phone,
        address,
        role,
        gdpr_consent,
        gdpr_consent_date
    )
VALUES (
        uuidv7 (),
        'Admin HomeServices',
        'admin@homeservices.local',
        crypt ('Admin123!', gen_salt ('bf')),
        '0600000000',
        'Paris',
        'admin',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        uuidv7 (),
        'Client Test',
        'client@homeservices.local',
        crypt ('Client123!', gen_salt ('bf')),
        '0611111111',
        'Lyon',
        'client',
        TRUE,
        CURRENT_TIMESTAMP
    ),
    (
        uuidv7 (),
        'Garoody Chery',
        'provider@homeservices.local',
        crypt (
            'Provider123!',
            gen_salt ('bf')
        ),
        '0622222222',
        'Marseille',
        'provider',
        TRUE,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO NOTHING;