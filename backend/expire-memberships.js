const ClientMembership = require('./src/models/ClientMembership');

async function expireMemberships() {
  try {
    console.log('🔄 Running membership expiration process...');

    const result = await ClientMembership.expireOldMemberships();

    console.log(`✅ Successfully processed ${result.affectedRows} memberships`);
    console.log('📊 Memberships updated to "expired" status:', result.affectedRows);

    if (result.affectedRows > 0) {
      console.log('\n🔍 Checking updated status...');

      // Re-run the check script
      const { executeQuery } = require('./config/database');

      const expiredActive = await executeQuery(
        'SELECT COUNT(*) as count FROM client_memberships WHERE statut = "active" AND date_fin < CURDATE()'
      );
      console.log(`📊 Active memberships past end date: ${expiredActive[0].count}`);

      const totalExpired = await executeQuery(
        'SELECT COUNT(*) as count FROM client_memberships WHERE statut = "expired"'
      );
      console.log(`📊 Total expired memberships: ${totalExpired[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error expiring memberships:', error);
  }
}

expireMemberships().then(() => process.exit(0));