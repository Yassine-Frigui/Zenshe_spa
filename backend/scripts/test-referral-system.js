require('dotenv').config();
const axios = require('axios');
const ReferralCode = require('../src/models/ReferralCode');
const { executeQuery } = require('../config/database');

const BASE_URL = 'http://localhost:5000/api';

async function testReferralSystem() {
    console.log('🧪 Testing Referral Code System...\n');
    
    try {
        // Test 1: Create a referral code manually for a client
        console.log('1. Testing referral code creation...');
        
        // Get a test client from database
        const clients = await executeQuery('SELECT * FROM clients LIMIT 1');
        if (clients.length === 0) {
            console.log('❌ No clients found in database. Please create a client first.');
            return;
        }
        
        const testClient = clients[0];
        console.log(`   Using test client: ${testClient.nom} ${testClient.prenom} (${testClient.email})`);
        
        // Create referral code
        const referralCode = await ReferralCode.createReferralCode(testClient.id, 15.0, 5);
        console.log(`   ✅ Created referral code: ${referralCode.code} (15% discount, max 5 uses)`);
        
        // Test 2: Validate referral code for signup
        console.log('\n2. Testing referral code validation for signup...');
        try {
            const validationResponse = await axios.post(`${BASE_URL}/referral-codes/validate-for-signup`, {
                code: referralCode.code
            });
            console.log(`   ✅ Code validation successful: ${validationResponse.data.message}`);
        } catch (error) {
            console.log(`   ❌ Code validation failed: ${error.response?.data?.error || error.message}`);
        }
        
        // Test 3: Test admin login with +dashboard suffix
        console.log('\n3. Testing admin login with +dashboard suffix...');
        
        // Get admin user from database
        const admins = await executeQuery('SELECT * FROM utilisateurs WHERE role IN ("admin", "super_admin") LIMIT 1');
        if (admins.length === 0) {
            console.log('   ⚠️  No admin users found. Creating test admin...');
            
            // Create test admin
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const result = await executeQuery(
                'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif) VALUES (?, ?, ?, ?, ?)',
                ['Test Admin', 'testadmin@example.com', hashedPassword, 'admin', true]
            );
            console.log(`   ✅ Created test admin with ID: ${result.insertId}`);
        } else {
            const testAdmin = admins[0];
            console.log(`   Using existing admin: ${testAdmin.nom} (${testAdmin.email})`);
            
            // Test login with +dashboard suffix
            const adminEmailWithSuffix = testAdmin.email.replace('@', '+dashboard@');
            console.log(`   Testing login with email: ${adminEmailWithSuffix}`);
            
            // Note: We can't easily test the login without knowing the password
            // This would require manual testing through the frontend
            console.log('   ⚠️  Admin login with +dashboard suffix requires manual testing through frontend');
        }
        
        // Test 4: Get referral codes (admin endpoint)
        console.log('\n4. Testing admin referral code listing...');
        const referralCodes = await ReferralCode.getAllReferralCodes(10, 0);
        console.log(`   ✅ Retrieved ${referralCodes.codes.length} referral codes from database`);
        
        // Test 5: Validate referral code with proper client validation
        console.log('\n5. Testing referral code validation with client validation...');
        
        // Create another test client
        const testClientData = {
            nom: 'Test',
            prenom: 'Client',
            email: `testclient${Date.now()}@example.com`,
            telephone: '+21612345678',
            mot_de_passe: await require('bcrypt').hash('test123', 12),
            email_verifie: true,
            statut: 'actif',
            date_creation: new Date()
        };
        
        const ClientModel = require('../src/models/Client');
        const newClientId = await ClientModel.createClient(testClientData);
        console.log(`   Created test client with ID: ${newClientId}`);
        
        // Validate code for this new client
        const validation = await ReferralCode.validateCode(referralCode.code, newClientId);
        if (validation.valid) {
            console.log(`   ✅ Code validation successful for new client: ${validation.discountPercentage}% discount`);
            
            // Test using the referral code
            const usage = await ReferralCode.useReferralCode(referralCode.code, newClientId, null, 25.50);
            console.log(`   ✅ Code usage recorded successfully. Discount amount: $${usage.discountAmount}`);
        } else {
            console.log(`   ❌ Code validation failed: ${validation.reason}`);
        }
        
        // Test 6: Test code reuse prevention
        console.log('\n6. Testing referral code reuse prevention...');
        try {
            await ReferralCode.useReferralCode(referralCode.code, newClientId, null, 15.00);
            console.log('   ❌ Code reuse should have been prevented');
        } catch (error) {
            console.log(`   ✅ Code reuse properly prevented: ${error.message}`);
        }
        
        console.log('\n🎉 Referral system testing completed!');
        
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await executeQuery('DELETE FROM referral_usage WHERE referral_code_id = ?', [referralCode.id]);
        await executeQuery('DELETE FROM referral_codes WHERE id = ?', [referralCode.id]);
        await executeQuery('DELETE FROM clients WHERE id = ?', [newClientId]);
        console.log('   ✅ Test data cleaned up');
        
    } catch (error) {
        console.error('❌ Error during testing:', error.message);
        console.error('Stack trace:', error.stack);
    }
    
    process.exit(0);
}

// Run tests
testReferralSystem();