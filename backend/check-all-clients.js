const { executeQuery } = require('./config/database');

async function checkAllClientsReferralStatus() {
  try {
    console.log('=== Checking All Clients Referral Status ===');
    
    // Get all clients
    const clients = await executeQuery('SELECT id, prenom, nom, email FROM clients ORDER BY id');
    console.log(`Total clients found: ${clients.length}\n`);
    
    const clientsWithoutReferrals = [];
    const clientsWithReferrals = [];
    
    for (const client of clients) {
      // Check for referral codes
      const referrals = await executeQuery('SELECT * FROM referral_codes WHERE owner_client_id = ?', [client.id]);
      
      if (referrals.length === 0) {
        clientsWithoutReferrals.push(client);
        console.log(`❌ Client ${client.id}: ${client.prenom} ${client.nom} - NO referral code`);
      } else {
        clientsWithReferrals.push(client);
        console.log(`✅ Client ${client.id}: ${client.prenom} ${client.nom} - ${referrals.length} referral code(s)`);
        referrals.forEach(ref => console.log(`   📋 Code: ${ref.code} (Active: ${ref.is_active})`));
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Clients WITH referral codes: ${clientsWithReferrals.length}`);
    console.log(`❌ Clients WITHOUT referral codes: ${clientsWithoutReferrals.length}`);
    
    if (clientsWithoutReferrals.length > 0) {
      console.log('\n📝 Clients needing referral codes:');
      clientsWithoutReferrals.forEach(client => {
        console.log(`   - ID ${client.id}: ${client.prenom} ${client.nom} (${client.email})`);
      });
    }
    
    return {
      total: clients.length,
      withReferrals: clientsWithReferrals.length,
      withoutReferrals: clientsWithoutReferrals.length,
      clientsNeedingCodes: clientsWithoutReferrals
    };
    
  } catch (error) {
    console.error('Error checking clients:', error.message);
    return null;
  } finally {
    process.exit();
  }
}

checkAllClientsReferralStatus();