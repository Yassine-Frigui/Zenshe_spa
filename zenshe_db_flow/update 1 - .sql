-- ============================================================================
-- ZENSHE SPA - Services and Categories Update Script
-- ============================================================================
-- This script updates all services and categories with proper assignments
-- Date: 2025-10-10
-- ============================================================================

USE zenshespa_database;

-- ============================================================================
-- STEP 1: Update existing services with correct category assignments
-- ============================================================================

-- V-Steam category (ID: 1)
UPDATE services SET categorie_id = 1 WHERE id IN (1, 2, 3, 7);

-- Vajacials category (ID: 2)
UPDATE services SET categorie_id = 2 WHERE id IN (4, 5, 6, 8, 9);

-- Packages inherit parent's category
UPDATE services SET categorie_id = 1 WHERE id IN (10, 11, 12, 13);

-- ============================================================================
-- STEP 2: Insert new services for Massages category (ID: 3)
-- ============================================================================

-- Feet and Back Massage - 10 minutes
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Massage Pieds et Dos (10 min)',
    'Massage relaxant des pieds et du dos avec machines spécialisées',
    'Massage ciblé de 10 minutes pour détendre les pieds et le dos',
    'base',
    NULL,
    3,
    20.00,
    10,
    1,
    0,
    0,
    1
);

SET @massage_10min_id = LAST_INSERT_ID();

-- Feet and Back Massage - 20 minutes
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Massage Pieds et Dos (20 min)',
    'Massage relaxant prolongé des pieds et du dos',
    'Massage approfondi de 20 minutes pour une relaxation optimale',
    'base',
    NULL,
    3,
    30.00,
    20,
    1,
    1,
    0,
    2
);

SET @massage_20min_id = LAST_INSERT_ID();

-- Feet and Back Massage - 30 minutes
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Massage Pieds et Dos (30 min)',
    'Massage complet des pieds et du dos',
    'Session complète de 30 minutes pour une détente profonde',
    'base',
    NULL,
    3,
    40.00,
    30,
    1,
    0,
    0,
    3
);

SET @massage_30min_id = LAST_INSERT_ID();

-- Eye Massage - 10 minutes
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Massage des Yeux (10 min)',
    'Massage doux et relaxant du contour des yeux',
    'Soin spécialisé pour réduire la fatigue oculaire et détendre',
    'base',
    NULL,
    3,
    25.00,
    10,
    1,
    0,
    0,
    4
);

SET @eye_massage_10min_id = LAST_INSERT_ID();

-- Eye Massage - 15 minutes
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Massage des Yeux (15 min)',
    'Massage prolongé du contour des yeux',
    'Soin approfondi pour une relaxation maximale du contour des yeux',
    'base',
    NULL,
    3,
    30.00,
    15,
    1,
    0,
    0,
    5
);

SET @eye_massage_15min_id = LAST_INSERT_ID();

-- ============================================================================
-- STEP 3: Insert new services for Japanese Head Spa category (ID: 5)
-- ============================================================================

-- 45 min Discovery Ritual
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Rituel Découverte (45 min)',
    'Détox botanique du cuir chevelu avec produits La Biosthetique',
    'Rituel découverte de 45 minutes incluant nettoyage, massage et traitement du cuir chevelu',
    'base',
    NULL,
    5,
    140.00,
    45,
    1,
    0,
    1,
    1
);

SET @spa_45min_id = LAST_INSERT_ID();

-- 60 min Classic Ritual
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Rituel Classique (60 min)',
    'Soin complet du cuir chevelu avec massage relaxant',
    'Rituel classique de 60 minutes pour une expérience spa capillaire complète',
    'base',
    NULL,
    5,
    180.00,
    60,
    1,
    1,
    1,
    2
);

SET @spa_60min_id = LAST_INSERT_ID();

-- 90 min Deluxe Ritual
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Rituel Deluxe (90 min)',
    'Expérience spa capillaire ultime avec soins premium',
    'Rituel deluxe de 90 minutes incluant tous les traitements premium',
    'base',
    NULL,
    5,
    250.00,
    90,
    1,
    1,
    1,
    3
);

SET @spa_90min_id = LAST_INSERT_ID();

-- ============================================================================
-- STEP 4: Update Épilation category name and insert Brazilian Wax service
-- ============================================================================

-- Update category name from "Épilation" to more specific
UPDATE categories_services 
SET nom = 'Épilation', 
    description = 'Services d\'épilation professionnels incluant la cire brésilienne'
WHERE id = 6;

-- Insert Brazilian Wax service
INSERT INTO services (
    nom, description, description_detaillee, service_type, parent_service_id, 
    categorie_id, prix, duree, actif, populaire, nouveau, ordre_affichage
) VALUES (
    'Épilation Brésilienne',
    'Épilation complète à la cire brésilienne',
    'Service d\'épilation brésilienne professionnel pour une peau douce et lisse',
    'base',
    NULL,
    6,
    80.00,
    45,
    1,
    1,
    0,
    1
);

SET @brazilian_wax_id = LAST_INSERT_ID();

-- ============================================================================
-- STEP 5: Insert French translations for all new services
-- ============================================================================

-- Massages - Feet and Back 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_10min_id,
    'fr',
    'Massage Pieds et Dos (10 min)',
    'Massage relaxant des pieds et du dos avec machines spécialisées',
    'Massage ciblé de 10 minutes pour détendre les pieds et le dos utilisant des équipements professionnels',
    NULL,
    'Non recommandé en cas de blessures récentes ou d\'inflammations',
    'Boire beaucoup d\'eau après le massage'
);

-- Massages - Feet and Back 20min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_20min_id,
    'fr',
    'Massage Pieds et Dos (20 min)',
    'Massage relaxant prolongé des pieds et du dos',
    'Massage approfondi de 20 minutes pour une relaxation optimale des pieds et du dos',
    NULL,
    'Non recommandé en cas de blessures récentes ou d\'inflammations',
    'Boire beaucoup d\'eau et se reposer après le massage'
);

-- Massages - Feet and Back 30min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_30min_id,
    'fr',
    'Massage Pieds et Dos (30 min)',
    'Massage complet des pieds et du dos',
    'Session complète de 30 minutes pour une détente profonde et durable',
    NULL,
    'Non recommandé en cas de blessures récentes ou d\'inflammations',
    'Boire beaucoup d\'eau et éviter les activités intenses'
);

-- Massages - Eye Massage 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_10min_id,
    'fr',
    'Massage des Yeux (10 min)',
    'Massage doux et relaxant du contour des yeux',
    'Soin spécialisé de 10 minutes pour réduire la fatigue oculaire et les tensions',
    NULL,
    'Non recommandé en cas d\'infection oculaire ou de chirurgie récente',
    'Éviter de se frotter les yeux après le massage'
);

-- Massages - Eye Massage 15min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_15min_id,
    'fr',
    'Massage des Yeux (15 min)',
    'Massage prolongé du contour des yeux',
    'Soin approfondi de 15 minutes pour une relaxation maximale du contour des yeux',
    NULL,
    'Non recommandé en cas d\'infection oculaire ou de chirurgie récente',
    'Éviter de se frotter les yeux et appliquer une compresse fraîche si besoin'
);

-- Japanese Head Spa - 45min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_45min_id,
    'fr',
    'Rituel Découverte (45 min)',
    'Détox botanique du cuir chevelu avec produits La Biosthetique',
    'Rituel découverte de 45 minutes incluant analyse du cuir chevelu, nettoyage profond, massage relaxant et traitement personnalisé',
    'Analyse capillaire, produits premium La Biosthetique, thé offert',
    'Non recommandé en cas de lésions ou irritations du cuir chevelu',
    'Ne pas laver les cheveux pendant 24h pour maximiser les bienfaits'
);

-- Japanese Head Spa - 60min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_60min_id,
    'fr',
    'Rituel Classique (60 min)',
    'Soin complet du cuir chevelu avec massage relaxant prolongé',
    'Rituel classique de 60 minutes offrant une expérience spa capillaire complète avec massage étendu des épaules et nuque',
    'Analyse capillaire, massage étendu, produits premium La Biosthetique, thé et collation',
    'Non recommandé en cas de lésions ou irritations du cuir chevelu',
    'Ne pas laver les cheveux pendant 24-48h, éviter les produits coiffants'
);

-- Japanese Head Spa - 90min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_90min_id,
    'fr',
    'Rituel Deluxe (90 min)',
    'Expérience spa capillaire ultime avec tous les soins premium',
    'Rituel deluxe de 90 minutes incluant tous les traitements premium, massage complet de la tête, épaules et nuque, et soins intensifs',
    'Analyse approfondie, massage complet, masque premium, produits La Biosthetique, thé et collation premium',
    'Non recommandé en cas de lésions ou irritations du cuir chevelu',
    'Ne pas laver les cheveux pendant 48h, utiliser uniquement des produits recommandés'
);

-- Brazilian Wax
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @brazilian_wax_id,
    'fr',
    'Épilation Brésilienne',
    'Épilation complète à la cire brésilienne',
    'Service d\'épilation brésilienne professionnel utilisant de la cire de qualité supérieure pour une peau douce et lisse',
    'Préparation de la peau, cire premium, soin apaisant post-épilation',
    'Non recommandé pendant la grossesse, sur peau irritée ou brûlée par le soleil',
    'Éviter l\'exposition au soleil, les bains chauds et les vêtements serrés pendant 24h'
);

-- ============================================================================
-- STEP 6: Insert English translations for all new services
-- ============================================================================

-- Massages - Feet and Back 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_10min_id,
    'en',
    'Feet and Back Massage (10 min)',
    'Relaxing feet and back massage with specialized machines',
    'Targeted 10-minute massage to relax feet and back using professional equipment',
    NULL,
    'Not recommended in case of recent injuries or inflammations',
    'Drink plenty of water after the massage'
);

-- Massages - Feet and Back 20min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_20min_id,
    'en',
    'Feet and Back Massage (20 min)',
    'Extended relaxing feet and back massage',
    'Deep 20-minute massage for optimal relaxation of feet and back',
    NULL,
    'Not recommended in case of recent injuries or inflammations',
    'Drink plenty of water and rest after the massage'
);

-- Massages - Feet and Back 30min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_30min_id,
    'en',
    'Feet and Back Massage (30 min)',
    'Complete feet and back massage',
    'Full 30-minute session for deep and lasting relaxation',
    NULL,
    'Not recommended in case of recent injuries or inflammations',
    'Drink plenty of water and avoid intense activities'
);

-- Massages - Eye Massage 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_10min_id,
    'en',
    'Eye Massage (10 min)',
    'Gentle and relaxing eye area massage',
    'Specialized 10-minute treatment to reduce eye fatigue and tension',
    NULL,
    'Not recommended in case of eye infection or recent surgery',
    'Avoid rubbing eyes after the massage'
);

-- Massages - Eye Massage 15min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_15min_id,
    'en',
    'Eye Massage (15 min)',
    'Extended eye area massage',
    'Deep 15-minute treatment for maximum relaxation of the eye area',
    NULL,
    'Not recommended in case of eye infection or recent surgery',
    'Avoid rubbing eyes and apply a cool compress if needed'
);

-- Japanese Head Spa - 45min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_45min_id,
    'en',
    'Discovery Ritual (45 min)',
    'Botanical scalp detox with La Biosthetique products',
    '45-minute discovery ritual including scalp analysis, deep cleansing, relaxing massage and personalized treatment',
    'Scalp analysis, premium La Biosthetique products, complimentary tea',
    'Not recommended in case of scalp lesions or irritations',
    'Do not wash hair for 24h to maximize benefits'
);

-- Japanese Head Spa - 60min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_60min_id,
    'en',
    'Classic Ritual (60 min)',
    'Complete scalp treatment with extended relaxing massage',
    '60-minute classic ritual offering a complete hair spa experience with extended shoulder and neck massage',
    'Scalp analysis, extended massage, premium La Biosthetique products, tea and snack',
    'Not recommended in case of scalp lesions or irritations',
    'Do not wash hair for 24-48h, avoid styling products'
);

-- Japanese Head Spa - 90min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_90min_id,
    'en',
    'Deluxe Ritual (90 min)',
    'Ultimate hair spa experience with all premium treatments',
    '90-minute deluxe ritual including all premium treatments, complete head, shoulder and neck massage, and intensive care',
    'In-depth analysis, complete massage, premium mask, La Biosthetique products, premium tea and snack',
    'Not recommended in case of scalp lesions or irritations',
    'Do not wash hair for 48h, use only recommended products'
);

-- Brazilian Wax
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @brazilian_wax_id,
    'en',
    'Brazilian Wax',
    'Complete Brazilian waxing service',
    'Professional Brazilian waxing service using premium quality wax for smooth and silky skin',
    'Skin preparation, premium wax, post-waxing soothing treatment',
    'Not recommended during pregnancy, on irritated or sunburned skin',
    'Avoid sun exposure, hot baths and tight clothing for 24h'
);

-- ============================================================================
-- STEP 7: Insert Arabic translations for all new services
-- ============================================================================

-- Massages - Feet and Back 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_10min_id,
    'ar',
    'تدليك القدمين والظهر (10 دقائق)',
    'تدليك مريح للقدمين والظهر باستخدام أجهزة متخصصة',
    'تدليك مستهدف لمدة 10 دقائق لإرخاء القدمين والظهر باستخدام معدات احترافية',
    NULL,
    'غير موصى به في حالة الإصابات الحديثة أو الالتهابات',
    'شرب الكثير من الماء بعد التدليك'
);

-- Massages - Feet and Back 20min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_20min_id,
    'ar',
    'تدليك القدمين والظهر (20 دقيقة)',
    'تدليك مريح ممتد للقدمين والظهر',
    'تدليك عميق لمدة 20 دقيقة للاسترخاء الأمثل للقدمين والظهر',
    NULL,
    'غير موصى به في حالة الإصابات الحديثة أو الالتهابات',
    'شرب الكثير من الماء والراحة بعد التدليك'
);

-- Massages - Feet and Back 30min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @massage_30min_id,
    'ar',
    'تدليك القدمين والظهر (30 دقيقة)',
    'تدليك كامل للقدمين والظهر',
    'جلسة كاملة لمدة 30 دقيقة للاسترخاء العميق والدائم',
    NULL,
    'غير موصى به في حالة الإصابات الحديثة أو الالتهابات',
    'شرب الكثير من الماء وتجنب الأنشطة المكثفة'
);

-- Massages - Eye Massage 10min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_10min_id,
    'ar',
    'تدليك العيون (10 دقائق)',
    'تدليك لطيف ومريح لمحيط العين',
    'علاج متخصص لمدة 10 دقائق لتقليل إجهاد العين والتوتر',
    NULL,
    'غير موصى به في حالة عدوى العين أو الجراحة الحديثة',
    'تجنب فرك العينين بعد التدليك'
);

-- Massages - Eye Massage 15min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @eye_massage_15min_id,
    'ar',
    'تدليك العيون (15 دقيقة)',
    'تدليك ممتد لمحيط العين',
    'علاج عميق لمدة 15 دقيقة للاسترخاء الأقصى لمحيط العين',
    NULL,
    'غير موصى به في حالة عدوى العين أو الجراحة الحديثة',
    'تجنب فرك العينين وضع كمادات باردة إذا لزم الأمر'
);

-- Japanese Head Spa - 45min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_45min_id,
    'ar',
    'طقس الاكتشاف (45 دقيقة)',
    'تنقية نباتية لفروة الرأس بمنتجات لا بيوستيتيك',
    'طقس اكتشاف لمدة 45 دقيقة يشمل تحليل فروة الرأس والتنظيف العميق والتدليك المريح والعلاج الشخصي',
    'تحليل فروة الرأس، منتجات لا بيوستيتيك الفاخرة، شاي مجاني',
    'غير موصى به في حالة وجود جروح أو تهيج في فروة الرأس',
    'عدم غسل الشعر لمدة 24 ساعة لتحقيق أقصى فائدة'
);

-- Japanese Head Spa - 60min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_60min_id,
    'ar',
    'الطقس الكلاسيكي (60 دقيقة)',
    'علاج كامل لفروة الرأس مع تدليك مريح ممتد',
    'طقس كلاسيكي لمدة 60 دقيقة يقدم تجربة سبا شعر كاملة مع تدليك ممتد للكتفين والرقبة',
    'تحليل فروة الرأس، تدليك ممتد، منتجات لا بيوستيتيك الفاخرة، شاي ووجبة خفيفة',
    'غير موصى به في حالة وجود جروح أو تهيج في فروة الرأس',
    'عدم غسل الشعر لمدة 24-48 ساعة، تجنب منتجات التصفيف'
);

-- Japanese Head Spa - 90min
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @spa_90min_id,
    'ar',
    'الطقس الفاخر (90 دقيقة)',
    'تجربة سبا شعر نهائية مع جميع العلاجات الفاخرة',
    'طقس فاخر لمدة 90 دقيقة يشمل جميع العلاجات الفاخرة، تدليك كامل للرأس والكتفين والرقبة، ورعاية مكثفة',
    'تحليل متعمق، تدليك كامل، قناع فاخر، منتجات لا بيوستيتيك، شاي ووجبة خفيفة فاخرة',
    'غير موصى به في حالة وجود جروح أو تهيج في فروة الرأس',
    'عدم غسل الشعر لمدة 48 ساعة، استخدام المنتجات الموصى بها فقط'
);

-- Brazilian Wax
INSERT INTO services_translations (
    service_id, language_code, nom, description, description_detaillee, 
    inclus, contre_indications, conseils_apres_soin
) VALUES (
    @brazilian_wax_id,
    'ar',
    'إزالة الشعر البرازيلية',
    'خدمة إزالة الشعر البرازيلية الكاملة',
    'خدمة إزالة الشعر البرازيلية الاحترافية باستخدام شمع عالي الجودة للحصول على بشرة ناعمة وحريرية',
    'تحضير البشرة، شمع فاخر، علاج مهدئ بعد إزالة الشعر',
    'غير موصى به أثناء الحمل، على البشرة المتهيجة أو المحروقة من الشمس',
    'تجنب التعرض للشمس والحمامات الساخنة والملابس الضيقة لمدة 24 ساعة'
);

-- ============================================================================
-- STEP 8: Update category translations
-- ============================================================================

-- Update Massages category translation
UPDATE categories_services_translations 
SET description = 'Massages des pieds, du dos et des yeux avec équipements spécialisés'
WHERE category_id = 3 AND language_code = 'fr';

UPDATE categories_services_translations 
SET description = 'Feet, back and eye massages with specialized equipment'
WHERE category_id = 3 AND language_code = 'en';

INSERT INTO categories_services_translations (category_id, language_code, nom, description)
VALUES (3, 'ar', 'التدليك', 'تدليك القدمين والظهر والعيون بمعدات متخصصة')
ON DUPLICATE KEY UPDATE 
    nom = 'التدليك',
    description = 'تدليك القدمين والظهر والعيون بمعدات متخصصة';

-- Update Épilation category translation
INSERT INTO categories_services_translations (category_id, language_code, nom, description)
VALUES (6, 'ar', 'إزالة الشعر', 'خدمات إزالة الشعر الاحترافية بما في ذلك الشمع البرازيلي')
ON DUPLICATE KEY UPDATE 
    nom = 'إزالة الشعر',
    description = 'خدمات إزالة الشعر الاحترافية بما في ذلك الشمع البرازيلي';

-- ============================================================================
-- STEP 9: Verification queries
-- ============================================================================

-- Show updated category distribution
SELECT 
    c.id,
    c.nom as category,
    COUNT(s.id) as service_count
FROM categories_services c
LEFT JOIN services s ON c.id = s.categorie_id AND s.actif = 1
WHERE c.actif = 1
GROUP BY c.id
ORDER BY c.ordre_affichage;

-- Show all services by category
SELECT 
    c.nom as category,
    s.nom as service,
    s.prix as price,
    s.duree as duration,
    s.service_type as type
FROM services s
INNER JOIN categories_services c ON s.categorie_id = c.id
WHERE s.actif = 1
ORDER BY c.ordre_affichage, s.ordre_affichage;

-- ============================================================================
-- Script completed successfully
-- ============================================================================

SELECT '✅ Services and categories update completed successfully!' as status;
