const { executeQuery } = require('./config/database');

async function checkMembershipStatus() {
  try {
    console.log('🔍 Checking membership expiration status...\n');

    // Check active memberships that have expired
    const expiredActive = await executeQuery(
      'SELECT COUNT(*) as count FROM client_memberships WHERE statut = "active" AND date_fin < CURDATE()'
    );
    console.log(`📊 Active memberships past end date: ${expiredActive[0].count}`);

    // Check total active memberships
    const totalActive = await executeQuery(
      'SELECT COUNT(*) as count FROM client_memberships WHERE statut = "active"'
    );
    console.log(`📊 Total active memberships: ${totalActive[0].count}`);

    // Check total expired memberships
    const totalExpired = await executeQuery(
      'SELECT COUNT(*) as count FROM client_memberships WHERE statut = "expired"'
    );
    console.log(`📊 Total expired memberships: ${totalExpired[0].count}`);

    // Show some examples of expired active memberships
    if (expiredActive[0].count > 0) {
      console.log('\n📋 Examples of expired active memberships:');
      const examples = await executeQuery(`
        SELECT cm.id, c.prenom, c.nom, cm.date_fin, m.nom as membership_nom
        FROM client_memberships cm
        JOIN clients c ON cm.client_id = c.id
        JOIN memberships m ON cm.membership_id = m.id
        WHERE cm.statut = "active" AND cm.date_fin < CURDATE()
        LIMIT 5
      `);

      examples.forEach(membership => {
        console.log(`  - ${membership.prenom} ${membership.nom}: ${membership.membership_nom} (expired ${membership.date_fin})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking membership status:', error);
  }
}

checkMembershipStatus().then(() => process.exit(0));