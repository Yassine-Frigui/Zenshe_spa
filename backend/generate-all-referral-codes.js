const { executeQuery } = require('./config/database');
const ReferralCode = require('./src/models/ReferralCode');

async function generateReferralCodesForAllClients() {
  try {
    console.log('🚀 === Generating Referral Codes for All Clients ===');
    
    // Get all clients without referral codes
    const allClients = await executeQuery('SELECT id, prenom, nom, email FROM clients ORDER BY id');
    console.log(`Total clients found: ${allClients.length}`);
    
    let processedCount = 0;
    let generatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (const client of allClients) {
      try {
        console.log(`\n📋 Processing Client ${client.id}: ${client.prenom} ${client.nom}`);
        
        // Check if client already has referral codes
        const existingReferrals = await executeQuery(
          'SELECT * FROM referral_codes WHERE owner_client_id = ?', 
          [client.id]
        );
        
        if (existingReferrals.length > 0) {
          console.log(`   ✅ Already has ${existingReferrals.length} referral code(s) - SKIPPING`);
          skippedCount++;
        } else {
          console.log(`   🎯 Generating referral code...`);
          
          // Generate referral code using the ReferralCode model
          const newReferralCode = await ReferralCode.createReferralCode(
            client.id,      // owner_client_id
            10.00,          // discount_percentage
            null,           // max_uses (unlimited)
            null            // expires_at (no expiration)
          );
          
          console.log(`   ✅ Generated code: ${newReferralCode.code} (ID: ${newReferralCode.id})`);
          generatedCount++;
        }
        
        processedCount++;
        
      } catch (error) {
        console.log(`   ❌ ERROR generating code for client ${client.id}: ${error.message}`);
        errors.push({
          clientId: client.id,
          clientName: `${client.prenom} ${client.nom}`,
          error: error.message
        });
      }
    }
    
    console.log('\n🎉 === GENERATION COMPLETE ===');
    console.log(`📊 Summary:`);
    console.log(`   • Total clients processed: ${processedCount}`);
    console.log(`   • New referral codes generated: ${generatedCount}`);
    console.log(`   • Clients skipped (already had codes): ${skippedCount}`);
    console.log(`   • Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => {
        console.log(`   • Client ${error.clientId} (${error.clientName}): ${error.error}`);
      });
    }
    
    // Final verification
    console.log('\n🔍 === FINAL VERIFICATION ===');
    const finalCheck = await executeQuery(`
      SELECT 
        c.id,
        c.prenom,
        c.nom,
        COUNT(r.id) as referral_count
      FROM clients c
      LEFT JOIN referral_codes r ON c.id = r.owner_client_id
      GROUP BY c.id, c.prenom, c.nom
      ORDER BY c.id
    `);
    
    let clientsWithoutCodes = 0;
    finalCheck.forEach(client => {
      if (client.referral_count === 0) {
        console.log(`❌ Client ${client.id}: ${client.prenom} ${client.nom} - NO referral codes`);
        clientsWithoutCodes++;
      } else {
        console.log(`✅ Client ${client.id}: ${client.prenom} ${client.nom} - ${client.referral_count} referral code(s)`);
      }
    });
    
    console.log(`\n📈 Final Status: ${finalCheck.length - clientsWithoutCodes}/${finalCheck.length} clients have referral codes`);
    
    if (clientsWithoutCodes === 0) {
      console.log('🎊 SUCCESS: All clients now have referral codes!');
    } else {
      console.log(`⚠️  WARNING: ${clientsWithoutCodes} clients still don't have referral codes`);
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  } finally {
    process.exit();
  }
}

generateReferralCodesForAllClients();