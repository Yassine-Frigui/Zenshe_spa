const {executeQuery} = require('./config/database');

async function checkTables() {
    console.log('\n🔍 CHECKING CATEGORY TABLES IN DATABASE\n');
    console.log('='.repeat(60));
    
    try {
        // Show all tables with 'categor' in name
        const tables = await executeQuery("SHOW TABLES LIKE '%categor%'");
        console.log('\n📋 Tables matching "%categor%":');
        console.log(tables);
        
        // Check categories_services table
        console.log('\n\n🎯 CHECKING categories_services TABLE:');
        console.log('='.repeat(60));
        const serviceCategories = await executeQuery('SELECT * FROM categories_services LIMIT 5');
        console.log('\nFirst 5 rows from categories_services:');
        console.log(JSON.stringify(serviceCategories, null, 2));
        
        // Check product_categories table
        console.log('\n\n🛍️  CHECKING product_categories TABLE:');
        console.log('='.repeat(60));
        const productCategories = await executeQuery('SELECT * FROM product_categories LIMIT 5');
        console.log('\nFirst 5 rows from product_categories:');
        console.log(JSON.stringify(productCategories, null, 2));
        
        // Check translations table
        console.log('\n\n🌐 CHECKING categories_services_translations TABLE:');
        console.log('='.repeat(60));
        const translations = await executeQuery('SELECT * FROM categories_services_translations WHERE language_code = "fr" LIMIT 5');
        console.log('\nFirst 5 French translations:');
        console.log(JSON.stringify(translations, null, 2));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    }
    
    process.exit(0);
}

checkTables();
