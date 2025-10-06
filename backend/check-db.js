const { executeQuery } = require('./config/database');

async function checkClients() {
  try {
    // First check table structure
    console.log('=== Checking referral_codes table structure ===');
    const tableStructure = await executeQuery('DESCRIBE referral_codes');
    tableStructure.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type}`);
    });
    
    console.log('\n=== Checking clients ===');
    const clients = await executeQuery('SELECT id, prenom, nom, email FROM clients LIMIT 5');
    console.log('Clients found:', clients.length);
    
    for (const client of clients) {
      console.log(`Client ${client.id}: ${client.prenom} ${client.nom} - ${client.email}`);
      
      // Check for referral codes using correct column name
      const referrals = await executeQuery('SELECT * FROM referral_codes WHERE owner_client_id = ?', [client.id]);
      
      console.log(`  Referral codes: ${referrals.length}`);
      referrals.forEach(ref => console.log(`    ${ref.code} (Active: ${ref.is_active})`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkClients();