-- ====================================================================
-- FIX SERVICES STRUCTURE - CORRECT COUNTS AND ORGANIZATION
-- ====================================================================
-- Based on client requirements:
-- - Vajacials: 3 main services + 1 healing addon
-- - Massages: 7 services with proper subcategories
-- - Brazilian Wax: Properly categorized under Épilation
-- ====================================================================

USE zenshespa_database;

-- ====================================================================
-- 1. CLEAN UP VAJACIALS - MARK INCORRECT ONES AS INACTIVE
-- ====================================================================
-- Currently has 5 services, should have 3 base + healing addon
-- Cannot delete due to foreign key constraints, so mark as inactive instead

-- Keep only the 3 core Vajacials services active (Pre-Wax, Post-Wax, Restorative)
-- Mark the variant services (avec/sans épilation) as inactive
UPDATE services SET actif = 0 WHERE parent_service_id = 6 AND service_type = 'variant';

-- Add healing addon reference to V-Steam (ID 7) - should also work for Vajacials
UPDATE services SET description = 'Enhancement add-on for V-Steam and Vajacial services' WHERE id = 7;

SELECT '✅ Vajacials cleaned up - Now has 3 base services (variants marked inactive)' as status;

-- ====================================================================
-- 2. FIX MASSAGES - ADD MISSING SERVICES TO REACH 7 SERVICES
-- ====================================================================
-- Currently has 5: Pieds et Dos (10,20,30 min), Yeux (10,15 min)
-- Need to add: Full Massage Package (combining Feet/Back + Eyes)

-- Insert missing massage services
INSERT INTO services (
  nom, description, service_type, parent_service_id, categorie_id, 
  prix, duree, actif, populaire, ordre_affichage
) VALUES
-- Full Massage Package (Feet + Back + Eyes) - ID will be auto-generated
('Package Massage Complet', 'Massage pieds, dos et yeux complet (30 min pieds+dos + 15 min yeux)', 'base', NULL, 3, 65.00, 45, 1, 1, 6),
('Massage Pieds (Seul) - 10 min', 'Massage réflexologie des pieds uniquement', 'base', NULL, 3, 15.00, 10, 1, 0, 7);

SELECT '✅ Massages updated - Now has 7 services' as status;

-- ====================================================================
-- 3. ADD TRANSLATIONS FOR NEW MASSAGE SERVICES
-- ====================================================================

-- Get the IDs of newly inserted services
SET @package_id = (SELECT id FROM services WHERE nom = 'Package Massage Complet' LIMIT 1);
SET @feet_only_id = (SELECT id FROM services WHERE nom = 'Massage Pieds (Seul) - 10 min' LIMIT 1);

-- French translations
INSERT INTO services_translations (service_id, language_code, nom, description, inclus)
VALUES
(@package_id, 'fr', 'Package Massage Complet', 'Massage pieds, dos et yeux complet (30 min pieds+dos + 15 min yeux)', 'huiles essentielles, serviettes chaudes'),
(@feet_only_id, 'fr', 'Massage Pieds (Seul) - 10 min', 'Massage réflexologie des pieds uniquement', 'huiles essentielles');

-- English translations
INSERT INTO services_translations (service_id, language_code, nom, description, inclus)
VALUES
(@package_id, 'en', 'Full Massage Package', 'Complete feet, back and eyes massage (30 min feet+back + 15 min eyes)', 'essential oils, hot towels'),
(@feet_only_id, 'en', 'Feet Massage Only - 10 min', 'Reflexology foot massage only', 'essential oils');

-- Arabic translations
INSERT INTO services_translations (service_id, language_code, nom, description, inclus)
VALUES
(@package_id, 'ar', 'باقة التدليك الكاملة', 'تدليك كامل للقدمين والظهر والعينين (30 دقيقة قدمين+ظهر + 15 دقيقة عيون)', 'زيوت عطرية، مناشف ساخنة'),
(@feet_only_id, 'ar', 'تدليك القدمين فقط - 10 دقائق', 'تدليك انعكاسي للقدمين فقط', 'زيوت عطرية');

SELECT '✅ Massage translations added for FR/EN/AR' as status;

-- ====================================================================
-- 4. VERIFY BRAZILIAN WAX EXISTS
-- ====================================================================

-- Check if Brazilian wax already exists
SELECT id, nom, categorie_id FROM services WHERE nom LIKE '%r%silienne%' OR nom LIKE '%razilian%';

-- If it doesn't exist, add it
INSERT IGNORE INTO services (
  nom, description, service_type, categorie_id, 
  prix, duree, actif, populaire, ordre_affichage
) VALUES
('Épilation Brésilienne', 'Service d\'épilation brésilienne professionnelle', 'base', 6, 80.00, 45, 1, 1, 1);

-- Get the ID
SET @brazilian_id = (SELECT id FROM services WHERE nom LIKE '%pilation Br%silienne%' LIMIT 1);

-- Add translations if service was just created
INSERT IGNORE INTO services_translations (service_id, language_code, nom, description)
VALUES
(@brazilian_id, 'fr', 'Épilation Brésilienne', 'Service d\'épilation brésilienne professionnelle'),
(@brazilian_id, 'en', 'Brazilian Wax', 'Professional Brazilian waxing service'),
(@brazilian_id, 'ar', 'إزالة الشعر البرازيلي', 'خدمة إزالة الشعر البرازيلي الاحترافية');

SELECT '✅ Brazilian Wax verified/added' as status;

-- ====================================================================
-- FINAL VERIFICATION
-- ====================================================================

SELECT '==================== FINAL VERIFICATION ====================' as '';

-- Count services per category
SELECT 
  cs.id as category_id,
  COALESCE(cst.nom, cs.nom) as category_name,
  COUNT(s.id) as service_count,
  GROUP_CONCAT(s.nom ORDER BY s.ordre_affichage SEPARATOR ', ') as services
FROM categories_services cs
LEFT JOIN categories_services_translations cst ON cs.id = cst.category_id AND cst.language_code = 'fr'
LEFT JOIN services s ON s.categorie_id = cs.id AND s.actif = 1
WHERE cs.actif = 1
GROUP BY cs.id, cst.nom
ORDER BY cs.ordre_affichage;

SELECT '==================== EXPECTED COUNTS ====================' as '';
SELECT 'V-Steam: 8 services (base + packages)' as expected UNION ALL
SELECT 'Vajacials: 3 services (Pre-Wax, Post-Wax, Restorative) + Healing Addon shared with V-Steam' UNION ALL
SELECT 'Massages: 7 services (Feet+Back 10/20/30, Eyes 10/15, Full Package, Feet Only)' UNION ALL
SELECT 'Rituels ZenShe: 10 combination services' UNION ALL
SELECT 'Spa Capillaire: 3 services (45/60/90 min)' UNION ALL
SELECT 'Épilation: 1+ services (Brazilian Wax + any Pre/Post rituals)';

SELECT '✅ Service structure fix complete!' as status;
