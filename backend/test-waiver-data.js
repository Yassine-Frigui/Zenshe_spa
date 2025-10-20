const axios = require('axios');

async function testWaiverData() {
  try {
    console.log('Fetching waiver data...');
    const response = await axios.get('http://localhost:5000/api/jotform/submission/6366699216323577019', {
      headers: { 'Accept': 'application/json' }
    });

    console.log('Checking additional fields for objects:');
    const additional = response.data.additional;
    Object.entries(additional).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        console.log(`${key}: ${Array.isArray(value) ? 'Array' : 'Object'} - ${JSON.stringify(value)}`);
      } else if (typeof value === 'string' && value.includes('[object Object]')) {
        console.log(`Found [object Object] in: ${key} = ${value}`);
      }
    });

    console.log('\nSample of additional data:');
    const sampleEntries = Object.entries(additional).slice(0, 10);
    sampleEntries.forEach(([key, value]) => {
      console.log(`${key}: (${typeof value}) ${value}`);
    });

  } catch (error) {
    console.error('Error fetching waiver:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWaiverData();