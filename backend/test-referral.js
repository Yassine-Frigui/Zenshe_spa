const Client = require('./src/models/Client.js');
const ReferralCode = require('./src/models/ReferralCode.js');

async function testReferralSystem() {
  try {
    console.log('=== Testing Referral System ===');
    
    // Get all clients
    const clients = await Client.getAllClients(1, 10);
    console.log('Total clients:', clients.clients ? clients.clients.length : 0);
    
    const clientList = clients.clients || [];
    
    if (clientList.length === 0) {
      console.log('\n⚠️  No clients found. Creating a test client to verify auto-generation...');
      
      try {
        const testClient = await Client.createClient({
          nom: 'Test',
          prenom: 'Client',
          email: 'test@example.com',
          telephone: '12345678',
          statut: 'actif'
        });
        
        console.log(`✓ Created test client (ID: ${testClient.id})`);
        
        // Check if referral code was auto-generated
        const referralCode = await Client.getClientReferralCode(testClient.id);
        if (referralCode) {
          console.log(`✓ Referral code auto-generated: ${referralCode.code} (Active: ${referralCode.is_active})`);
        } else {
          console.log('✗ No referral code was auto-generated');
        }
      } catch (error) {
        console.log('✗ Error creating test client:', error.message);
      }
    } else {
      // Check referral codes for first 3 clients
      for (const client of clientList.slice(0, 3)) {
        console.log(`\nClient: ${client.prenom} ${client.nom} (ID: ${client.id})`);
        try {
          const referralCode = await Client.getClientReferralCode(client.id);
          if (referralCode) {
            console.log(`  ✓ Referral code: ${referralCode.code} (Active: ${referralCode.is_active})`);
          } else {
            console.log('  ✗ No referral code found - generating one...');
            
            const newCode = await ReferralCode.createForClient(client.id);
            console.log(`  ✓ Generated: ${newCode.code}`);
          }
        } catch (error) {
          console.log('  ✗ Error:', error.message);
        }
      }
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit();
  }
}

testReferralSystem();