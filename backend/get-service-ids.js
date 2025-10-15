const { executeQuery } = require('./config/database');

async function getServiceIds() {
    try {
        console.log('=== Fetching Service IDs ===\n');
        
        // Get all services with French names to map IDs
        const services = await executeQuery(`
            SELECT 
                s.id,
                s.nom as french_name,
                s.duree as duration,
                s.prix as price,
                c.nom as category,
                st_ar.nom as arabic_name,
                st_ar.id as has_arabic_translation
            FROM services s
            LEFT JOIN categories_services c ON s.categorie_id = c.id
            LEFT JOIN services_translations st_ar ON s.id = st_ar.service_id AND st_ar.language_code = 'ar'
            WHERE s.actif = 1
            ORDER BY s.id
        `);
        
        console.log('Total services:', services.length);
        console.log('\nServices with Arabic translations:');
        services.forEach(s => {
            if (s.has_arabic_translation) {
                console.log(`ID: ${s.id}, FR: ${s.french_name}, AR: ${s.arabic_name}`);
            }
        });
        
        console.log('\nServices WITHOUT Arabic translations:');
        services.forEach(s => {
            if (!s.has_arabic_translation) {
                console.log(`ID: ${s.id}, FR: ${s.french_name}, Category: ${s.category}, Duration: ${s.duration}min`);
            }
        });
        
        console.log('\nNew services (likely IDs 14+):');
        const newServices = services.filter(s => s.id >= 14);
        newServices.forEach(s => {
            console.log(`ID: ${s.id}, Name: ${s.french_name}, Category: ${s.category}, Has AR: ${!!s.has_arabic_translation}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

getServiceIds();
