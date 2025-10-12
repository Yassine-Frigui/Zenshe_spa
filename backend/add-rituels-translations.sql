-- ================================================================
-- ADD TRANSLATIONS FOR RITUELS ZENSHE SERVICES (IDs 23-32)
-- ================================================================

USE zenshespa_database;

-- ================================================================
-- FRENCH TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (23, 'fr', 'Steam & Eyes Reset', '10min de vapeur relaxante + 10min de massage des yeux + thé offert', NOW(), NOW()),
    (24, 'fr', 'Feet Retreat', '10min de vapeur relaxante + 10min de massage des pieds (machine) + thé', NOW(), NOW()),
    (25, 'fr', 'Quick Glow Duo', '10min de vapeur relaxante + 10min de massage du visage + thé', NOW(), NOW()),
    (26, 'fr', 'Full Relax Reset', '10min de vapeur + 10min massage des yeux + 10min massage des pieds + thé', NOW(), NOW()),
    (27, 'fr', 'Steam & Aromatherapy Head Ritual', '10min de vapeur + 15min massage crânien aromathérapie (huile essentielle) + thé', NOW(), NOW()),
    (28, 'fr', 'Steam & Reflexology Ritual', '10min de vapeur relaxante + 20min de réflexologie plantaire + thé', NOW(), NOW()),
    (29, 'fr', 'Womb & Mind Ritual', '30min de vapeur relaxante + 45min Spa Capillaire Japonais (Rituel Découverte) + thé', NOW(), NOW()),
    (30, 'fr', 'Tranquility for Two', 'Chacune : 30min de vapeur + 10min au choix (yeux ou pieds) + thé (120 TND par personne)', NOW(), NOW()),
    (31, 'fr', 'Option Contre-indication', '10min de vapeur + 10min massage des yeux + thé (quand vapeur prolongée contre-indiquée)', NOW(), NOW()),
    (32, 'fr', 'Rituel ZenMama Grossesse', '30min sans vapeur : massage crânien aux points de pression + massage des pieds + massage des yeux + thé', NOW(), NOW());

-- ================================================================
-- ENGLISH TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (23, 'en', 'Steam & Eyes Reset', '10min Relaxation Steam + 10min Eye Massage + complimentary tea', NOW(), NOW()),
    (24, 'en', 'Feet Retreat', '10min Relaxation Steam + 10min Foot Massage (machine) + tea', NOW(), NOW()),
    (25, 'en', 'Quick Glow Duo', '10min Relaxation Steam + 10min Face Massage + tea', NOW(), NOW()),
    (26, 'en', 'Full Relax Reset', '10min Relaxation Steam + 10min Eye Massage + 10min Foot Massage + tea', NOW(), NOW()),
    (27, 'en', 'Steam & Aromatherapy Head Ritual', '10min Relaxation Steam + 15min Aromatherapy Head Massage (essential oil) + tea', NOW(), NOW()),
    (28, 'en', 'Steam & Reflexology Ritual', '10min Relaxation Steam + 20min Foot Reflexology + tea', NOW(), NOW()),
    (29, 'en', 'Womb & Mind Ritual', '30min Relaxation Steam + 45min Japanese Head Spa (Discovery Ritual) + tea', NOW(), NOW()),
    (30, 'en', 'Tranquility for Two', 'Each: 30min Relaxation Steam + 10min choice of Eye or Foot Massage + tea (120 TND per person)', NOW(), NOW()),
    (31, 'en', 'Contraindication Option', '10min Relaxation Steam + 10min Eye Massage + tea (when longer steam contraindicated)', NOW(), NOW()),
    (32, 'en', 'ZenMama Pregnancy Ritual', '30min steam-free: pressure-point Head Massage + Feet Massage + Eye Massage + tea', NOW(), NOW());

-- ================================================================
-- ARABIC TRANSLATIONS
-- ================================================================

INSERT INTO services_translations (service_id, language_code, nom, description, date_creation, date_modification)
VALUES
    (23, 'ar', 'تجديد البخار والعيون', '10 دقائق بخار استرخاء + 10 دقائق تدليك العين + شاي مجاني', NOW(), NOW()),
    (24, 'ar', 'خلوة القدمين', '10 دقائق بخار استرخاء + 10 دقائق تدليك القدمين (آلة) + شاي', NOW(), NOW()),
    (25, 'ar', 'ثنائي التوهج السريع', '10 دقائق بخار استرخاء + 10 دقائق تدليك الوجه + شاي', NOW(), NOW()),
    (26, 'ar', 'إعادة ضبط الاسترخاء الكامل', '10 دقائق بخار + 10 دقائق تدليك العين + 10 دقائق تدليك القدمين + شاي', NOW(), NOW()),
    (27, 'ar', 'طقوس البخار والعلاج بالروائح', '10 دقائق بخار + 15 دقيقة تدليك الرأس بالروائح (زيت عطري) + شاي', NOW(), NOW()),
    (28, 'ar', 'طقوس البخار وعلم المنعكسات', '10 دقائق بخار استرخاء + 20 دقيقة علم انعكاسات القدم + شاي', NOW(), NOW()),
    (29, 'ar', 'طقوس الرحم والعقل', '30 دقيقة بخار استرخاء + 45 دقيقة سبا الرأس الياباني (طقوس الاكتشاف) + شاي', NOW(), NOW()),
    (30, 'ar', 'الهدوء لشخصين', 'لكل: 30 دقيقة بخار استرخاء + 10 دقائق اختيار تدليك العين أو القدم + شاي (120 دينار للشخص)', NOW(), NOW()),
    (31, 'ar', 'خيار موانع الاستعمال', '10 دقائق بخار + 10 دقائق تدليك العين + شاي (عند موانع البخار المطول)', NOW(), NOW()),
    (32, 'ar', 'طقوس زين ماما للحمل', '30 دقيقة بدون بخار: تدليك الرأس بنقاط الضغط + تدليك القدمين + تدليك العين + شاي', NOW(), NOW());

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT '✅ Translations added successfully!' as status;

-- Show translation count per language
SELECT 
    language_code,
    COUNT(*) as translation_count
FROM services_translations 
WHERE service_id BETWEEN 23 AND 32
GROUP BY language_code;

-- Show a sample of translations
SELECT 
    service_id,
    language_code,
    nom,
    LEFT(description, 50) as description_preview
FROM services_translations 
WHERE service_id BETWEEN 23 AND 32
ORDER BY service_id, language_code;
