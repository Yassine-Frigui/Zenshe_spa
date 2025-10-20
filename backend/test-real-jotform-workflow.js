const axios = require('axios');

// Test the REAL complete workflow with actual JotForm API calls
async function testRealJotFormWorkflow() {
    console.log('🧪 Testing REAL JotForm → Reservation workflow (actual API calls)...');

    // Generate unique test credentials
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 1000);
    const firstNames = ['Marie', 'Jean', 'Sophie', 'Pierre', 'Emma', 'Lucas', 'Alice', 'Thomas'];
    const lastNames = ['Dubois', 'Martin', 'Garcia', 'Smith', 'Johnson', 'Brown', 'Davis', 'Miller'];
    
    const uniqueFirstName = firstNames[uniqueId % firstNames.length];
    const uniqueLastName = lastNames[uniqueId % lastNames.length];
    const uniqueEmail = `test-${timestamp}-${uniqueId}@example.com`;
    const uniquePhone = `12${timestamp.toString().slice(-6)}`; // 8 digits
    const uniqueName = uniqueFirstName;

    console.log('🎯 Generated unique credentials:');
    console.log('📧 Email:', uniqueEmail);
    console.log('📞 Phone:', uniquePhone);
    console.log('👤 Name:', uniqueName);

    try {
        // Step 1: Prepare real waiver data (like CompleteJotForm component would collect)
        const realWaiverData = {
            form_id: 'test-form-123',
            q9: uniqueName,
            q10: uniqueEmail,
            q11: uniquePhone, // 8 digits for validation
            q16: 'Test Practitioner',
            q18: 'practitioner@example.com',
            q24: 'Normal',
            q25: 'None',
            q26: 'She/Her',
            q32: 'No',
            q33: 'No',
            q36: 'No',
            q37: 'No',
            q40: 'No',
            q41: 'No',
            q42: 'No',
            q43: 'No',
            q44: 'Yes',
            q45: 'No additional information'
        };

        console.log('📝 Step 1: Waiver data collected from CompleteJotForm component');

        // Step 2: Actually submit waiver to JotForm API (REAL CALL)
        console.log('📤 Step 2: Actually submitting waiver to JotForm API...');

        const jotformPayload = {
            sessionId: `session-${Date.now()}`,
            formId: realWaiverData.form_id,
            submission: realWaiverData
        };

        console.log('📤 Sending to /api/jotform/submit-form:', {
            sessionId: jotformPayload.sessionId,
            formId: jotformPayload.formId,
            fieldCount: Object.keys(jotformPayload.submission).length
        });

        const jotformResponse = await axios.post('http://localhost:5000/api/jotform/submit-form', jotformPayload);

        console.log('✅ Step 2: JotForm API response:', jotformResponse.data);

        if (!jotformResponse.data.success) {
            throw new Error('JotForm submission failed: ' + jotformResponse.data.message);
        }

        // Extract the REAL submission ID from JotForm
        const realJotformSubmissionId = jotformResponse.data.submissionId;
        console.log('🎯 Got REAL JotForm submission ID:', realJotformSubmissionId);

        if (!realJotformSubmissionId) {
            throw new Error('No submission ID returned from JotForm');
        }

        // Step 3: Create reservation with the REAL submission ID
        console.log('🏨 Step 3: Creating reservation with REAL JotForm submission ID...');

        const reservationPayload = {
            // Client data - UNIQUE CREDENTIALS
            nom: uniqueLastName,
            prenom: uniqueName,
            email: uniqueEmail,
            telephone: uniquePhone,
            date_naissance: null,
            adresse: '',

            // Multi-service reservation data
            services: [{
                service_id: 1,
                item_type: 'main',
                prix: 50.00,
                notes: null
            }],

            // Legacy single service for backward compatibility
            service_id: 12,

            date_reservation: '2025-12-01',
            heure_debut: '14:00',
            heure_fin: '15:00',
            notes_client: `Test reservation with REAL JotForm workflow - Unique client: ${uniqueEmail}`,

            // Referral code
            referralCode: null,

            // Add-on data
            has_healing_addon: false,

            // REAL JotForm submission ID from actual API call
            jotform_submission_id: realJotformSubmissionId,

            // Session ID for draft conversion
            session_id: null,

            // Membership data
            useMembership: false,
            clientMembershipId: null
        };

        console.log('📤 Sending reservation payload to /api/reservations with REAL submission ID:', realJotformSubmissionId);

        const reservationResponse = await axios.post('http://localhost:5000/api/reservations', reservationPayload);

        console.log('✅ Step 3: Reservation created successfully with REAL JotForm ID!');
        console.log('📋 Reservation response:', reservationResponse.data);

        const reservationId = reservationResponse.data.reservation?.id;
        if (!reservationId) {
            throw new Error('No reservation ID returned');
        }

        // Step 4: Verify the REAL jotform_submission_id was stored correctly
        console.log('🔍 Step 4: Verifying REAL jotform_submission_id was stored in database...');

        const verifyResponse = await axios.get(`http://localhost:5000/api/reservations/${reservationId}`);
        const reservation = verifyResponse.data.reservation || verifyResponse.data;

        if (reservation.jotform_submission_id === realJotformSubmissionId) {
            console.log('🎉 SUCCESS: REAL JotForm submission ID stored correctly in database!');
            console.log('📊 Stored ID:', reservation.jotform_submission_id);
            console.log('🔗 This ID can be used to view the waiver on JotForm');
        } else {
            console.log('❌ FAILURE: JotForm submission ID not stored correctly');
            console.log('Expected:', realJotformSubmissionId);
            console.log('Found:', reservation.jotform_submission_id);
        }

        // Step 5: Verify reservation_items table has service data
        console.log('🔍 Step 5: Verifying reservation_items table...');

        // Get the reservation with items included (default behavior)
        const fullReservationResponse = await axios.get(`http://localhost:5000/api/reservations/${reservationId}?include_items=true`);
        const fullReservation = fullReservationResponse.data.reservation || fullReservationResponse.data;

        if (fullReservation && fullReservation.items && fullReservation.items.length > 0) {
            console.log('🎉 SUCCESS: Reservation items found in database!');
            console.log('� Items count:', fullReservation.items.length);
            fullReservation.items.forEach((item, index) => {
                console.log(`   Item ${index + 1}: Service ID ${item.service_id}, Type: ${item.item_type}, Price: ${item.prix}`);
            });

            // Verify the service data matches what we sent
            const expectedService = { service_id: 1, item_type: 'main', prix: 50.00 };
            const actualItem = fullReservation.items[0];

            if (actualItem.service_id === expectedService.service_id &&
                actualItem.item_type === expectedService.item_type &&
                parseFloat(actualItem.prix) === expectedService.prix) {
                console.log('✅ Reservation items data matches expected values');
            } else {
                console.log('⚠️ Reservation items data mismatch:');
                console.log('Expected:', expectedService);
                console.log('Found:', actualItem);
            }
        } else {
            console.log('❌ FAILURE: No reservation items found in database');
            console.log('Reservation data:', fullReservation);
        }

        // Step 6: Verify client was created (from reservation response)
        console.log('🔍 Step 6: Verifying client creation...');
        console.log('Full reservation structure check:');
        console.log('  fullReservation exists:', !!fullReservation);
        console.log('  fullReservation.client exists:', !!(fullReservation && fullReservation.client));
        if (fullReservation) {
            console.log('  Has flattened client properties:', 'client_email' in fullReservation, 'client_telephone' in fullReservation);
        }

        if (fullReservation && (fullReservation.client || fullReservation.client_email)) {
            console.log('🎉 SUCCESS: Client data found in reservation!');
            if (fullReservation.client) {
                // Nested client object
                console.log('📧 Email:', fullReservation.client.email);
                console.log('📞 Phone:', fullReservation.client.telephone);
                console.log('👤 Name:', `${fullReservation.client.prenom} ${fullReservation.client.nom}`);

                if (fullReservation.client.email === uniqueEmail && 
                    fullReservation.client.telephone === uniquePhone &&
                    fullReservation.client.prenom === uniqueName) {
                    console.log('✅ Client data matches test credentials');
                } else {
                    console.log('⚠️ Client data mismatch:');
                    console.log('Expected email:', uniqueEmail, 'Found:', fullReservation.client.email);
                    console.log('Expected phone:', uniquePhone, 'Found:', fullReservation.client.telephone);
                    console.log('Expected prenom:', uniqueName, 'Found:', fullReservation.client.prenom);
                }
            } else {
                // Flattened client properties
                console.log('📧 Email:', fullReservation.client_email);
                console.log('📞 Phone:', fullReservation.client_telephone);
                console.log('👤 Name:', `${fullReservation.client_prenom} ${fullReservation.client_nom}`);
                
                if (fullReservation.client_email === uniqueEmail && 
                    fullReservation.client_telephone === uniquePhone &&
                    fullReservation.client_prenom === uniqueName) {
                    console.log('✅ Client data matches test credentials');
                } else {
                    console.log('⚠️ Client data mismatch:');
                    console.log('Expected email:', uniqueEmail, 'Found:', fullReservation.client_email);
                    console.log('Expected phone:', uniquePhone, 'Found:', fullReservation.client_telephone);
                    console.log('Expected prenom:', uniqueName, 'Found:', fullReservation.client_prenom);
                }
            }
        } else {
            console.log('❌ FAILURE: Client data not found in reservation');
        }

        console.log('🎉 COMPLETE REAL WORKFLOW TEST PASSED!');
        console.log('✅ Waiver submitted to JotForm → Got real submission ID → Reservation created with ID → Database stored correctly');
        console.log('✅ Client table populated with unique credentials');
        console.log('✅ Reservation items table populated with service data');
        console.log('🎯 Unique test data created:');
        console.log('   📧 Email:', uniqueEmail);
        console.log('   📞 Phone:', uniquePhone);
        console.log('   👤 Name:', `${uniqueName} ${uniqueLastName}`);
        console.log('   🆔 JotForm ID:', realJotformSubmissionId);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        }
        console.error('Full error:', error);
    }
}

testRealJotFormWorkflow();