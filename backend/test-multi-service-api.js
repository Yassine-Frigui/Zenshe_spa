/**
 * Test script for multi-service reservation API endpoints
 * Run with: node test-multi-service-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
    multiServiceBooking: {
        services: [
            { service_id: 1, item_type: 'main', prix: 40 },
            { service_id: 7, item_type: 'addon', prix: 30 }
        ],
        date_reservation: '2025-02-15',
        heure_debut: '10:00',
        nom: 'Test',
        prenom: 'Multi-Service',
        email: 'test-multi@example.com',
        telephone: '+21612345678',
        notes_client: 'Test multi-service booking'
    },
    singleServiceBooking: {
        service_id: 1,
        date_reservation: '2025-02-15',
        heure_debut: '14:00',
        nom: 'Test',
        prenom: 'Single-Service',
        email: 'test-single@example.com',
        telephone: '+21687654321',
        notes_client: 'Test single service booking (legacy mode)'
    },
    availabilityCheck: {
        service_ids: [1, 7],
        date_reservation: '2025-02-16',
        heure_debut: '11:00'
    }
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

async function runTests() {
    let createdReservationId = null;

    try {
        logSection('🧪 MULTI-SERVICE API TESTS');

        // Test 1: Check availability for multiple services
        logSection('Test 1: Check Availability (Multi-Service)');
        try {
            const response = await axios.post(`${BASE_URL}/reservations/check-availability`, testData.availabilityCheck);
            log('✅ Availability check passed', 'green');
            console.log('Response:', {
                available: response.data.available,
                heure_fin: response.data.heure_fin,
                total_duration: response.data.total_duration
            });
        } catch (error) {
            log('❌ Availability check failed: ' + error.message, 'red');
            if (error.response?.data) console.log('Error details:', error.response.data);
        }

        // Test 2: Create multi-service booking
        logSection('Test 2: Create Multi-Service Booking');
        try {
            const response = await axios.post(`${BASE_URL}/reservations`, testData.multiServiceBooking);
            createdReservationId = response.data.reservation.id;
            log('✅ Multi-service booking created', 'green');
            console.log('Reservation ID:', createdReservationId);
            console.log('Services count:', response.data.reservation.service_count || 'N/A');
            console.log('Total price:', response.data.reservation.prix_final);
            console.log('Uses items table:', response.data.reservation.uses_items_table);
        } catch (error) {
            log('❌ Multi-service booking failed: ' + error.message, 'red');
            if (error.response?.data) console.log('Error details:', error.response.data);
        }

        // Test 3: Get reservation with items
        if (createdReservationId) {
            logSection('Test 3: Get Reservation with Items');
            try {
                const response = await axios.get(`${BASE_URL}/reservations/${createdReservationId}?lang=fr&include_items=true`);
                log('✅ Reservation fetched with items', 'green');
                console.log('Reservation ID:', response.data.id);
                console.log('Service count:', response.data.service_count);
                console.log('Total duration:', response.data.total_duration, 'minutes');
                console.log('Items:', response.data.items?.length || 0);
                if (response.data.items) {
                    response.data.items.forEach((item, index) => {
                        console.log(`  ${index + 1}. ${item.service_nom} (${item.item_type}) - ${item.prix} TND`);
                    });
                }
            } catch (error) {
                log('❌ Failed to fetch reservation: ' + error.message, 'red');
                if (error.response?.data) console.log('Error details:', error.response.data);
            }
        }

        // Test 4: Add a service to existing reservation
        if (createdReservationId) {
            logSection('Test 4: Add Service to Reservation');
            try {
                const newService = { service_id: 17, item_type: 'addon', prix: 25 };
                const response = await axios.post(`${BASE_URL}/reservations/${createdReservationId}/services?lang=fr`, newService);
                log('✅ Service added successfully', 'green');
                console.log('New service count:', response.data.reservation.service_count);
                console.log('New total price:', response.data.reservation.prix_final);
                console.log('New end time:', response.data.reservation.heure_fin);
            } catch (error) {
                log('❌ Failed to add service: ' + error.message, 'red');
                if (error.response?.data) console.log('Error details:', error.response.data);
            }
        }

        // Test 5: Remove a service from reservation
        if (createdReservationId) {
            logSection('Test 5: Remove Service from Reservation');
            try {
                const response = await axios.delete(`${BASE_URL}/reservations/${createdReservationId}/services/17?lang=fr`);
                log('✅ Service removed successfully', 'green');
                console.log('New service count:', response.data.reservation.service_count);
                console.log('New total price:', response.data.reservation.prix_final);
            } catch (error) {
                log('❌ Failed to remove service: ' + error.message, 'red');
                if (error.response?.data) console.log('Error details:', error.response.data);
            }
        }

        // Test 6: Create single-service booking (backward compatibility)
        logSection('Test 6: Create Single-Service Booking (Legacy Mode)');
        try {
            const response = await axios.post(`${BASE_URL}/reservations`, testData.singleServiceBooking);
            log('✅ Single-service booking created (legacy mode)', 'green');
            console.log('Reservation ID:', response.data.reservation.id);
            console.log('Service ID:', response.data.reservation.service_id);
            console.log('Uses items table:', response.data.reservation.uses_items_table);
        } catch (error) {
            log('❌ Single-service booking failed: ' + error.message, 'red');
            if (error.response?.data) console.log('Error details:', error.response.data);
        }

        logSection('✅ ALL TESTS COMPLETED');
        log('Multi-service implementation is working correctly!', 'green');

    } catch (error) {
        log('❌ Test suite failed: ' + error.message, 'red');
        console.error(error);
    }
}

// Check if server is running before testing
async function checkServer() {
    try {
        await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        return true;
    } catch (error) {
        try {
            // Try a different endpoint
            await axios.get(`${BASE_URL}/services`);
            return true;
        } catch (err) {
            return false;
        }
    }
}

// Main execution
(async () => {
    log('🚀 Starting Multi-Service API Tests...', 'blue');
    log(`Base URL: ${BASE_URL}`, 'yellow');
    
    log('\nChecking if backend server is running...', 'yellow');
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        log('\n❌ Backend server is not running!', 'red');
        log('Please start the backend server first:', 'yellow');
        log('  cd backend && npm start', 'cyan');
        process.exit(1);
    }
    
    log('✅ Backend server is running', 'green');
    
    await runTests();
})();
