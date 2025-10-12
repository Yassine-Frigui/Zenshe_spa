// Start the server and test the categories endpoint
const express = require('express');
const MultilingualService = require('./src/services/MultilingualService');

const app = express();

// Test route
app.get('/test-categories', async (req, res) => {
    console.log('\n🧪 TEST: Direct call to MultilingualService.getCategoriesWithTranslations()');
    console.log('='.repeat(70));
    
    try {
        const categories = await MultilingualService.getCategoriesWithTranslations('fr');
        
        console.log(`\n✅ Retrieved ${categories.length} categories`);
        console.log('\n📋 Categories:');
        categories.forEach((cat, i) => {
            console.log(`\n${i + 1}. ID: ${cat.id}`);
            console.log(`   nom: ${cat.nom}`);
            console.log(`   name: ${cat.name || 'N/A'}`);
            console.log(`   description: ${cat.description?.substring(0, 50)}...`);
            console.log(`   Fields: ${Object.keys(cat).join(', ')}`);
        });
        
        const response = {
            success: true,
            data: categories,
            total: categories.length,
            language: 'fr'
        };
        
        console.log('\n📤 Sending response:');
        console.log(JSON.stringify(response, null, 2));
        console.log('='.repeat(70));
        
        res.json(response);
    } catch (error) {
        console.error('\n❌ ERROR:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5555;
app.listen(PORT, () => {
    console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
    console.log(`\n📍 Test the endpoint:`);
    console.log(`   curl http://localhost:${PORT}/test-categories`);
    console.log(`   or visit: http://localhost:${PORT}/test-categories\n`);
});
