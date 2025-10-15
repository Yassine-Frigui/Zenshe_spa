-- ================================================================
-- FIX ARABIC TRANSLATIONS FOR CATEGORIES_SERVICES_TRANSLATIONS
-- ================================================================

SET NAMES utf8mb4;
SET CHARACTER_SET_CLIENT = utf8mb4;
SET CHARACTER_SET_CONNECTION = utf8mb4;
SET CHARACTER_SET_RESULTS = utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;

USE zenshespa_database;

-- ================================================================
-- STEP 1: Delete corrupted Arabic translations for categories
-- ================================================================

DELETE FROM categories_services_translations WHERE language_code = 'ar';

-- ================================================================
-- STEP 2: Re-insert all Arabic translations with proper UTF-8
-- ================================================================

INSERT INTO categories_services_translations (id, category_id, language_code, nom, description, date_creation, date_modification) VALUES
(14, 1, 'ar', 'V-Steam', 'حمام البخار المهبلي بالأعشاب مع استشارة قبل وبعد الجلسة بالإضافة إلى مشروب مجاني', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(15, 2, 'ar', 'Vajacials', 'بروتوكول العناية الحميمة من ثلاث خطوات مع استشارة صحية لمدة 5 دقائق', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(16, 3, 'ar', 'تدليك', 'تدليك القدمين والظهر والعينين بأجهزة متخصصة', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(17, 4, 'ar', 'طقوس زين شي', 'مجموعات العناية لتجربة عافية كاملة', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(18, 5, 'ar', 'سبا الشعر الياباني', 'إزالة السموم النباتية من فروة الرأس بمنتجات La Biosthetique', '2025-08-04 13:16:48', '2025-08-04 13:16:48'),
(19, 6, 'ar', 'إزالة الشعر', 'خدمات إزالة الشعر المهنية', '2025-08-04 13:16:48', '2025-08-04 13:16:48');

-- ================================================================
-- STEP 3: Verify the fix
-- ================================================================

SELECT '✅ Categories Arabic translations fixed successfully!' as status;

-- Count Arabic translations for categories
SELECT
    'Total Arabic category translations' as metric,
    COUNT(*) as count
FROM categories_services_translations
WHERE language_code = 'ar';

-- Show all Arabic category translations
SELECT
    c.id as category_id,
    c.nom as french_name,
    cst.nom as arabic_name,
    LEFT(cst.description, 50) as arabic_description_preview
FROM categories_services c
LEFT JOIN categories_services_translations cst ON c.id = cst.category_id AND cst.language_code = 'ar'
WHERE c.actif = 1
ORDER BY c.ordre_affichage;

-- Show services without Arabic translations (should be none)
SELECT
    c.id,
    c.nom as french_name
FROM categories_services c
LEFT JOIN categories_services_translations cst ON c.id = cst.category_id AND cst.language_code = 'ar'
WHERE cst.id IS NULL AND c.actif = 1
ORDER BY c.id;