// Quick test to verify categories API
const axios = require('axios');

async function testCategoriesAPI() {
  try {
    console.log('Testing categories API...\n');
    
    const response = await axios.get('http://localhost:5000/api/public/services/categories/list?lang=fr');
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
    console.log('✅ Number of categories:', response.data.length);
    console.log('\n📋 Categories with names:\n');
    
    response.data.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id} | Name: "${cat.nom}" | Color: ${cat.couleur_theme}`);
    });
    
    console.log('\n✅ Categories API is working correctly!');
    console.log('\nFull first category object:');
    console.log(JSON.stringify(response.data[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCategoriesAPI();
