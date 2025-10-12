-- ================================================================
-- ADD RITUELS ZENSHE SERVICES
-- Category 4: Rituels ZenShe (Combination services)
-- ================================================================

USE zenshespa_database;

-- ================================================================
-- STEP 1: INSERT NEW RITUELS ZENSHE SERVICES
-- ================================================================

-- Service 1: Steam & Eyes Reset • 55 TND
-- 10min Relaxation Steam + 10min Eye Massage + complimentary tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Steam & Eyes Reset',
    55.00,
    20,
    '10min Relaxation Steam + 10min Eye Massage + complimentary tea',
    'base',
    4,
    1,
    1
);
SET @service_steam_eyes = LAST_INSERT_ID();

-- Service 2: Feet Retreat • 70 TND
-- 10min Relaxation Steam + 10min Foot Massage (machine) + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Feet Retreat',
    70.00,
    20,
    '10min Relaxation Steam + 10min Foot Massage (machine) + tea',
    'base',
    4,
    1,
    2
);
SET @service_feet_retreat = LAST_INSERT_ID();

-- Service 3: Quick Glow Duo • 45 TND
-- 10min Relaxation Steam + 10min Face Massage + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Quick Glow Duo',
    45.00,
    20,
    '10min Relaxation Steam + 10min Face Massage + tea',
    'base',
    4,
    1,
    3
);
SET @service_quick_glow = LAST_INSERT_ID();

-- Service 4: Full Relax Reset • 85 TND
-- 10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Full Relax Reset',
    85.00,
    30,
    '10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea',
    'base',
    4,
    1,
    4
);
SET @service_full_relax = LAST_INSERT_ID();

-- Service 5: Steam & Aromatherapy Head Ritual • 115 TND
-- 10min Relaxation Steam + 15min Aromatherapy Head Massage (with essential oil) + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Steam & Aromatherapy Head Ritual',
    115.00,
    25,
    '10min Relaxation Steam + 15min Aromatherapy Head Massage (with essential oil) + tea',
    'base',
    4,
    1,
    5
);
SET @service_aromatherapy = LAST_INSERT_ID();

-- Service 6: Steam & Reflexology Ritual • 110 TND
-- 10min Relaxation Steam + 20min Foot Reflexology + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Steam & Reflexology Ritual',
    110.00,
    30,
    '10min Relaxation Steam + 20min Foot Reflexology + tea',
    'base',
    4,
    1,
    6
);
SET @service_reflexology = LAST_INSERT_ID();

-- Service 7: Womb & Mind Ritual • 230 TND
-- 30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Womb & Mind Ritual',
    230.00,
    75,
    '30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea',
    'base',
    4,
    1,
    7
);
SET @service_womb_mind = LAST_INSERT_ID();

-- Service 8: Tranquility for Two • 240 TND (120 TND per person)
-- Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Tranquility for Two',
    240.00,
    40,
    'Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea (120 TND per person)',
    'base',
    4,
    1,
    8
);
SET @service_tranquility = LAST_INSERT_ID();

-- Service 9: Contraindication Option • 55 TND
-- 10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'Contraindication Option',
    55.00,
    20,
    '10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)',
    'base',
    4,
    1,
    9
);
SET @service_contraindication = LAST_INSERT_ID();

-- Service 10: ZenMama Pregnancy Ritual • 95 TND
-- 30min steam-free sequence: hand-applied pressure-point Head Massage with pregnancy-safe essential oil + machine-assisted Feet Massage + Eye Massage + tea
INSERT INTO services (nom, prix, duree, description, service_type, categorie_id, actif, ordre_affichage)
VALUES (
    'ZenMama Pregnancy Ritual',
    95.00,
    30,
    '30min steam-free: pressure-point Head Massage with pregnancy-safe essential oil + Feet Massage + Eye Massage + tea',
    'base',
    4,
    1,
    10
);
SET @service_zenmama = LAST_INSERT_ID();

-- ================================================================
-- STEP 2: ADD FRENCH TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (@service_steam_eyes, 'fr', 'Steam & Eyes Reset', '10min de vapeur relaxante + 10min de massage des yeux + thé offert', NOW(), NOW()),
    (@service_feet_retreat, 'fr', 'Feet Retreat', '10min de vapeur relaxante + 10min de massage des pieds (machine) + thé', NOW(), NOW()),
    (@service_quick_glow, 'fr', 'Quick Glow Duo', '10min de vapeur relaxante + 10min de massage du visage + thé', NOW(), NOW()),
    (@service_full_relax, 'fr', 'Full Relax Reset', '10min de vapeur + 10min massage des yeux + 10min massage des pieds + thé', NOW(), NOW()),
    (@service_aromatherapy, 'fr', 'Steam & Aromatherapy Head Ritual', '10min de vapeur + 15min massage crânien aromathérapie (huile essentielle) + thé', NOW(), NOW()),
    (@service_reflexology, 'fr', 'Steam & Reflexology Ritual', '10min de vapeur relaxante + 20min de réflexologie plantaire + thé', NOW(), NOW()),
    (@service_womb_mind, 'fr', 'Womb & Mind Ritual', '30min de vapeur relaxante + 45min Spa Capillaire Japonais (Rituel Découverte) + thé', NOW(), NOW()),
    (@service_tranquility, 'fr', 'Tranquility for Two', 'Chacune : 30min de vapeur + 10min au choix (yeux ou pieds) + thé (120 TND par personne)', NOW(), NOW()),
    (@service_contraindication, 'fr', 'Option Contre-indication', '10min de vapeur + 10min massage des yeux + thé (quand vapeur prolongée contre-indiquée)', NOW(), NOW()),
    (@service_zenmama, 'fr', 'Rituel ZenMama Grossesse', '30min sans vapeur : massage crânien aux points de pression + massage des pieds + massage des yeux + thé', NOW(), NOW());

-- ================================================================
-- STEP 3: ADD ENGLISH TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (@service_steam_eyes, 'en', 'Steam & Eyes Reset', '10min Relaxation Steam + 10min Eye Massage + complimentary tea', NOW(), NOW()),
    (@service_feet_retreat, 'en', 'Feet Retreat', '10min Relaxation Steam + 10min Foot Massage (machine) + tea', NOW(), NOW()),
    (@service_quick_glow, 'en', 'Quick Glow Duo', '10min Relaxation Steam + 10min Face Massage + tea', NOW(), NOW()),
    (@service_full_relax, 'en', 'Full Relax Reset', '10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea', NOW(), NOW()),
    (@service_aromatherapy, 'en', 'Steam & Aromatherapy Head Ritual', '10min Relaxation Steam + 15min Aromatherapy Head Massage (essential oil) + tea', NOW(), NOW()),
    (@service_reflexology, 'en', 'Steam & Reflexology Ritual', '10min Relaxation Steam + 20min Foot Reflexology + tea', NOW(), NOW()),
    (@service_womb_mind, 'en', 'Womb & Mind Ritual', '30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea', NOW(), NOW()),
    (@service_tranquility, 'en', 'Tranquility for Two', 'Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea (120 TND per person)', NOW(), NOW()),
    (@service_contraindication, 'en', 'Contraindication Option', '10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)', NOW(), NOW()),
    (@service_zenmama, 'en', 'ZenMama Pregnancy Ritual', '30min steam-free: pressure-point Head Massage + Feet Massage + Eye Massage + tea', NOW(), NOW());

-- ================================================================
-- STEP 4: ADD ARABIC TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (@service_steam_eyes, 'ar', 'تجديد البخار والعيون', '10 دقائق بخار استرخاء + 10 دقائق تدليك العين + شاي مجاني', NOW(), NOW()),
    (@service_feet_retreat, 'ar', 'خلوة القدمين', '10 دقائق بخار استرخاء + 10 دقائق تدليك القدمين (آلة) + شاي', NOW(), NOW()),
    (@service_quick_glow, 'ar', 'ثنائي التوهج السريع', '10 دقائق بخار استرخاء + 10 دقائق تدليك الوجه + شاي', NOW(), NOW()),
    (@service_full_relax, 'ar', 'إعادة ضبط الاسترخاء الكامل', '10 دقائق بخار + 10 دقائق تدليك العين + 10 دقائق تدليك القدمين + شاي', NOW(), NOW()),
    (@service_aromatherapy, 'ar', 'طقوس البخار والعلاج بالروائح', '10 دقائق بخار + 15 دقيقة تدليك الرأس بالروائح (زيت عطري) + شاي', NOW(), NOW()),
    (@service_reflexology, 'ar', 'طقوس البخار وعلم المنعكسات', '10 دقائق بخار استرخاء + 20 دقيقة علم انعكاسات القدم + شاي', NOW(), NOW()),
    (@service_womb_mind, 'ar', 'طقوس الرحم والعقل', '30 دقيقة بخار استرخاء + 45 دقيقة سبا الرأس الياباني (طقوس الاكتشاف) + شاي', NOW(), NOW()),
    (@service_tranquility, 'ar', 'الهدوء لشخصين', 'لكل: 30 دقيقة بخار استرخاء + 10 دقائق اختيار تدليك العين أو القدم + شاي (120 دينار للشخص)', NOW(), NOW()),
    (@service_contraindication, 'ar', 'خيار موانع الاستعمال', '10 دقائق بخار + 10 دقائق تدليك العين + شاي (عند موانع البخار المطول)', NOW(), NOW()),
    (@service_zenmama, 'ar', 'طقوس زين ماما للحمل', '30 دقيقة بدون بخار: تدليك الرأس بنقاط الضغط + تدليك القدمين + تدليك العين + شاي', NOW(), NOW());

-- ================================================================
-- STEP 5: VERIFICATION
-- ================================================================

-- Show category distribution after adding services
SELECT 
    c.id,
    c.nom as category,
    COUNT(s.id) as service_count
FROM categories_services c
LEFT JOIN services s ON c.id = s.categorie_id AND s.actif = 1
WHERE c.actif = 1
GROUP BY c.id
ORDER BY c.ordre_affichage;

-- Show all Rituels ZenShe services
SELECT 
    s.id,
    s.nom as service,
    s.prix,
    s.duree,
    s.service_type
FROM services s
WHERE s.categorie_id = 4 AND s.actif = 1
ORDER BY s.ordre_affichage;

-- Show translation count
SELECT 
    COUNT(*) as translation_count,
    language_code
FROM services_translations st
JOIN services s ON st.service_id = s.id
WHERE s.categorie_id = 4
GROUP BY language_code;

SELECT '✅ Rituels ZenShe services added successfully!' as status;
