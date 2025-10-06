const Client = require('./src/models/Client.js');

async function testAutoGeneration() {
  try {
    console.log('=== Testing Auto-Generation of Referral Code ===');
    
    // Create a new client with a unique email
    const uniqueEmail = `test_${Date.now()}@example.com`;
    
    console.log(`Creating new client with email: ${uniqueEmail}`);
    
    const newClient = await Client.createClient({
      nom: 'Test',
      prenom: 'AutoGeneration',
      email: uniqueEmail,
      telephone: '99887766',
      statut: 'actif'
    });
    
    console.log(`✓ Created client (ID: ${newClient})`);
    
    // Check if referral code was auto-generated
    console.log('Checking for auto-generated referral code...');
    const referralCode = await Client.getClientReferralCode(newClient);
    
    if (referralCode) {
      console.log(`✅ SUCCESS: Referral code auto-generated!`);
      console.log(`   Code: ${referralCode.code}`);
      console.log(`   Discount: ${referralCode.discount_percentage}%`);
      console.log(`   Active: ${referralCode.is_active}`);
      console.log(`   Max uses: ${referralCode.max_uses || 'Unlimited'}`);
    } else {
      console.log(`❌ FAILED: No referral code was auto-generated`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    process.exit();
  }
}

testAutoGeneration();