/**
 * Simple direct test of multi-service booking
 */

// Test by making a curl-like request
const testEndpoint = 'http://localhost:5000/api/reservations/check-availability';
const testData = {
    service_ids: [1, 7],
    date_reservation: '2025-02-16',
    heure_debut: '11:00'
};

console.log('Testing multi-service availability check...');
console.log('Endpoint:', testEndpoint);
console.log('Data:', JSON.stringify(testData, null, 2));
console.log('\nTo test manually, run:');
console.log(`curl -X POST ${testEndpoint} -H "Content-Type: application/json" -d '${JSON.stringify(testData)}'`);
console.log('\nExpected: { available: true/false, heure_fin: "XX:XX", total_duration: XX }');
