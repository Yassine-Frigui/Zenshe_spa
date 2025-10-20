const axios = require('axios');
const ReservationModel = require('./src/models/Reservation');
const { executeQuery } = require('./config/database');

// Mock JotForm submission to avoid actual API calls during testing
async function mockJotFormSubmission(waiverData) {
    console.log('🎭 Mocking JotForm submission...');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock submission ID
    return {
        data: {
            success: true,
            message: 'Form submitted successfully!',
            submissionId: `mock-submission-${Date.now()}`,
            redirectUrl: '/thank-you'
        }
    };
}

async function testFullWorkflow() {
    try {
        console.log('🧪 Testing complete JotForm → Reservation workflow...');

        // Step 1: Simulate waiver data collection (like CompleteJotForm component)
        const mockWaiverData = {
            form_id: 'test-form-123',
            q9: 'Test Client Name',
            q10: 'test@example.com',
            q11: '1234567890',
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

        console.log('📝 Step 1: Waiver data collected:', Object.keys(mockWaiverData).length, 'fields');

        // Step 2: Submit waiver to JotForm (mocked)
        console.log('📤 Step 2: Submitting waiver to JotForm...');
        const waiverSubmissionData = {
            sessionId: `session-${Date.now()}`,
            formId: mockWaiverData.form_id,
            submission: mockWaiverData
        };

        const waiverResponse = await mockJotFormSubmission(waiverSubmissionData);
        console.log('✅ Step 2: Waiver submitted successfully:', waiverResponse.data);

        // Extract submission ID
        const jotformSubmissionId = waiverResponse.data.submissionId;
        console.log('📋 Got JotForm submission ID:', jotformSubmissionId);

        // Step 3: Create reservation with the submission ID
        console.log('🏨 Step 3: Creating reservation with JotForm submission ID...');

        const reservationData = {
            // Client data
            nom: 'Test',
            prenom: 'Client',
            email: 'test@example.com',
            telephone: '1234567890',
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
            service_id: 1,

            date_reservation: '2025-10-20',
            heure_debut: '10:00',
            heure_fin: '11:00',
            notes_client: 'Test reservation with JotForm workflow',

            // Referral code
            referralCode: null,

            // Add-on data
            has_healing_addon: false,

            // JotForm submission ID (from waiver submission)
            jotform_submission_id: jotformSubmissionId,

            // Session ID for draft conversion
            session_id: null,

            // Membership data
            useMembership: false,
            clientMembershipId: null
        };

        console.log('📝 Creating reservation with jotform_submission_id:', jotformSubmissionId);

        // This would normally go through the reservations route, but let's test the model directly
        const reservationId = await ReservationModel.createReservation({
            client_id: 1, // Assuming test client exists
            services: reservationData.services,
            service_id: reservationData.service_id,
            date_reservation: reservationData.date_reservation,
            heure_debut: reservationData.heure_debut,
            heure_fin: reservationData.heure_fin,
            notes_client: reservationData.notes_client,
            prix_service: 50.00,
            prix_final: 50.00,
            statut: 'en_attente',
            reservation_status: 'reserved',
            client_nom: reservationData.nom,
            client_prenom: reservationData.prenom,
            client_telephone: reservationData.telephone,
            client_email: reservationData.email,
            session_id: reservationData.session_id,
            referral_code_id: null,
            has_healing_addon: reservationData.has_healing_addon,
            addon_price: 0.00,
            jotform_submission_id: jotformSubmissionId
        });

        console.log('✅ Step 3: Reservation created successfully with ID:', reservationId);

        // Step 4: Verify the jotform_submission_id was stored correctly
        console.log('🔍 Step 4: Verifying jotform_submission_id was stored...');
        const result = await executeQuery(
            'SELECT jotform_submission_id FROM reservations WHERE id = ?',
            [reservationId]
        );

        if (result.length > 0 && result[0].jotform_submission_id === jotformSubmissionId) {
            console.log('✅ SUCCESS: JotForm submission ID stored correctly:', result[0].jotform_submission_id);
            console.log('🎉 Full workflow test PASSED!');
        } else {
            console.log('❌ FAILURE: JotForm submission ID not stored correctly');
            console.log('Expected:', jotformSubmissionId);
            console.log('Found:', result[0]?.jotform_submission_id);
        }

        // Clean up - delete test reservation
        await executeQuery('DELETE FROM reservations WHERE id = ?', [reservationId]);
        console.log('🧹 Test reservation cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
}

testFullWorkflow();