const { executeQuery } = require('./config/database');

/**
 * Fix service category assignments
 * - Assign package/variant services to their parent's category
 * - Ensure all active categories have services
 */
async function fixServiceCategories() {
    try {
        console.log('🔧 Starting service category fix...\n');

        // 1. First, let's see what we have
        console.log('📊 Current category distribution:');
        const categoryCount = await executeQuery(`
            SELECT 
                c.id,
                c.nom as category,
                COUNT(s.id) as service_count
            FROM categories_services c
            LEFT JOIN services s ON c.id = s.categorie_id AND s.actif = 1
            WHERE c.actif = 1
            GROUP BY c.id
            ORDER BY c.ordre_affichage
        `);
        console.table(categoryCount);

        // 2. Update variant and package services to inherit parent's category
        console.log('\n📝 Updating variant and package services to inherit parent category...');
        
        const packagesAndVariants = await executeQuery(`
            SELECT s.id, s.nom, s.service_type, s.parent_service_id, p.categorie_id as parent_category
            FROM services s
            INNER JOIN services p ON s.parent_service_id = p.id
            WHERE s.service_type IN ('variant', 'package')
            AND s.categorie_id IS NULL
            AND p.categorie_id IS NOT NULL
        `);

        console.log(`Found ${packagesAndVariants.length} services to update:`);
        console.table(packagesAndVariants);

        for (const service of packagesAndVariants) {
            await executeQuery(
                'UPDATE services SET categorie_id = ? WHERE id = ?',
                [service.parent_category, service.id]
            );
            console.log(`✅ Updated service ${service.id} (${service.nom}) to category ${service.parent_category}`);
        }

        // 3. Show final distribution
        console.log('\n✅ Updated category distribution:');
        const updatedCount = await executeQuery(`
            SELECT 
                c.id,
                c.nom as category,
                COUNT(s.id) as service_count
            FROM categories_services c
            LEFT JOIN services s ON c.id = s.categorie_id AND s.actif = 1
            WHERE c.actif = 1
            GROUP BY c.id
            ORDER BY c.ordre_affichage
        `);
        console.table(updatedCount);

        // 4. List services without categories
        console.log('\n🔍 Services still without category:');
        const uncategorized = await executeQuery(`
            SELECT id, nom, service_type, parent_service_id, actif
            FROM services
            WHERE categorie_id IS NULL AND actif = 1
        `);
        if (uncategorized.length > 0) {
            console.table(uncategorized);
        } else {
            console.log('✅ All active services now have categories!');
        }

        console.log('\n🎉 Service category fix complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing service categories:', error);
        process.exit(1);
    }
}

fixServiceCategories();
