const { executeQuery } = require('./config/database');

async function testServiceEncoding() {
    try {
        console.log('=== Testing Service Data Encoding ===\n');
        
        // Check database charset
        console.log('1. Checking database charset:');
        const [charset] = await executeQuery(`
            SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
            FROM information_schema.SCHEMATA
            WHERE SCHEMA_NAME = 'zenshespa_database'
        `);
        console.log('Database charset:', charset);
        console.log('');
        
        // Check services table charset
        console.log('2. Checking services_translations table charset:');
        const [tableCharset] = await executeQuery(`
            SELECT TABLE_NAME, TABLE_COLLATION
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = 'zenshespa_database' 
            AND TABLE_NAME = 'services_translations'
        `);
        console.log('Table charset:', tableCharset);
        console.log('');
        
        // Check column charsets
        console.log('3. Checking column charsets:');
        const columns = await executeQuery(`
            SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = 'zenshespa_database' 
            AND TABLE_NAME = 'services_translations'
            AND COLUMN_NAME IN ('nom', 'description', 'description_detaillee')
        `);
        console.log('Columns:', columns);
        console.log('');
        
        // Get sample Arabic service data
        console.log('4. Fetching sample Arabic service (id=14):');
        const arServices = await executeQuery(`
            SELECT 
                s.id,
                s.nom as base_nom,
                st_ar.nom as arabic_nom,
                st_ar.description as arabic_description,
                HEX(st_ar.nom) as hex_arabic_nom,
                LENGTH(st_ar.nom) as nom_length,
                CHAR_LENGTH(st_ar.nom) as nom_char_length
            FROM services s
            LEFT JOIN services_translations st_ar ON s.id = st_ar.service_id AND st_ar.language_code = 'ar'
            WHERE s.id = 14
        `);
        console.log('Arabic service data:', JSON.stringify(arServices[0], null, 2));
        console.log('');
        
        // Test multilingual query
        console.log('5. Testing multilingual query (like frontend would call):');
        const services = await executeQuery(`
            SELECT 
                s.id,
                COALESCE(st.nom, st_fr.nom) as nom,
                COALESCE(st.description, st_fr.description) as description,
                st.language_code as used_language
            FROM services s
            LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
            LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
            WHERE s.id = 14
        `, ['ar']);
        console.log('Multilingual query result:', JSON.stringify(services[0], null, 2));
        console.log('');
        
        // Check connection charset
        console.log('6. Checking connection charset:');
        const [connCharset] = await executeQuery('SELECT @@character_set_client, @@character_set_connection, @@character_set_results');
        console.log('Connection charset:', connCharset);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

testServiceEncoding();
