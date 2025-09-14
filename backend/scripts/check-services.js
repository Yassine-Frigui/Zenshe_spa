const { executeQuery } = require('../config/database');

async function checkServices() {
    console.log('🔍 Checking services in the database...');
    
    try {
        const allServices = await executeQuery('SELECT id, nom, categorie_id, service_type FROM services ORDER BY categorie_id, id');
        console.log('\n📋 All services:');
        allServices.forEach(service => {
            console.log(`ID: ${service.id}, Name: ${service.nom}, Category: ${service.categorie_id}, Type: ${service.service_type}`);
        });

        console.log('\n🎯 Category 1 services (categorie_id = 1):');
        const category1Services = allServices.filter(s => s.categorie_id === 1);
        category1Services.forEach(service => {
            console.log(`- ID: ${service.id}, Name: ${service.nom}, Type: ${service.service_type}`);
        });

        console.log('\n🌿 Healing addon service (ID 7):');
        const healingService = allServices.find(s => s.id === 7);
        if (healingService) {
            console.log(`- ID: ${healingService.id}, Name: ${healingService.nom}, Category: ${healingService.categorie_id}, Type: ${healingService.service_type}`);
        } else {
            console.log('- Healing service not found!');
        }

        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkServices();