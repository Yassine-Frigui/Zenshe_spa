const mysql = require('mysql2/promise');

async function testCategoriesArabic() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 4306,
            user: 'root',
            password: 'yassinej10',
            database: 'zenshespa_database',
            charset: 'utf8mb4'
        });

        console.log('🔍 Testing categories Arabic translations...\n');

        // Test categories translations
        const [categories] = await connection.execute(`
            SELECT
                c.id as category_id,
                c.nom as french_name,
                cst.nom as arabic_name,
                LEFT(cst.description, 60) as arabic_description_preview
            FROM categories_services c
            LEFT JOIN categories_services_translations cst ON c.id = cst.category_id AND cst.language_code = 'ar'
            WHERE c.actif = 1
            ORDER BY c.ordre_affichage
        `);

        console.log('📋 Categories Arabic translations:');
        categories.forEach(cat => {
            console.log(`ID ${cat.category_id}: ${cat.french_name} → ${cat.arabic_name || '❌ MISSING'}`);
            if (cat.arabic_name && cat.arabic_name.includes('?')) {
                console.log(`   ⚠️  CORRUPTED: ${cat.arabic_name}`);
            }
        });

        // Count translations
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total FROM categories_services_translations WHERE language_code = 'ar'
        `);

        console.log(`\n✅ Total Arabic category translations: ${countResult[0].total}`);

        // Check for missing translations
        const [missing] = await connection.execute(`
            SELECT c.id, c.nom as french_name
            FROM categories_services c
            LEFT JOIN categories_services_translations cst ON c.id = cst.category_id AND cst.language_code = 'ar'
            WHERE cst.id IS NULL AND c.actif = 1
        `);

        if (missing.length > 0) {
            console.log('\n❌ Missing Arabic translations for:');
            missing.forEach(cat => {
                console.log(`   Category ${cat.id}: ${cat.french_name}`);
            });
        } else {
            console.log('\n✅ All categories have Arabic translations!');
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testCategoriesArabic();