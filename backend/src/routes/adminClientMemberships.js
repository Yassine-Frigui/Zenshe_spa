const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get all client memberships with full details
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        cm.id,
        cm.client_id,
        c.nom AS client_nom,
        c.prenom AS client_prenom,
        c.email AS client_email,
        c.telephone AS client_telephone,
        cm.membership_id,
        m.nom AS membership_nom,
        m.services_par_mois,
        cm.date_debut,
        cm.date_fin,
        cm.services_total,
        cm.services_utilises,
        cm.services_restants,
        cm.montant_paye,
        cm.mode_paiement,
        cm.statut,
        cm.date_creation as created_at
      FROM client_memberships cm
      JOIN clients c ON cm.client_id = c.id
      JOIN memberships m ON cm.membership_id = m.id
      ORDER BY cm.date_creation DESC
    `;
    
    const [memberships] = await db.execute(query);
    
    res.json({
      success: true,
      data: memberships
    });
  } catch (error) {
    console.error('Error fetching all client memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des abonnements',
      error: error.message
    });
  }
});

// Create new client membership
router.post('/', authenticateAdmin, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      client_id, 
      membership_id, 
      duree_mois, 
      methode_paiement 
    } = req.body;
    
    // Validation
    if (!client_id || !membership_id || !duree_mois || !methode_paiement) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    
    // Validate duration (1 or 3 months only)
    if (![1, 3].includes(parseInt(duree_mois))) {
      return res.status(400).json({
        success: false,
        message: 'La durée doit être 1 ou 3 mois'
      });
    }
    
    // Get membership details
    const [membership] = await connection.execute(
      'SELECT * FROM memberships WHERE id = ? AND actif = 1',
      [membership_id]
    );
    
    if (membership.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé ou inactif'
      });
    }
    
    // Check if client exists
    const [client] = await connection.execute(
      'SELECT id FROM clients WHERE id = ?',
      [client_id]
    );
    
    if (client.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // Check if client already has an active membership
    const [activeMembership] = await connection.execute(
      `SELECT id FROM client_memberships 
       WHERE client_id = ? 
       AND statut = 'actif' 
       AND date_fin >= CURDATE()`,
      [client_id]
    );
    
    if (activeMembership.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le client a déjà un abonnement actif'
      });
    }
    
    const membershipData = membership[0];
    const duration = parseInt(duree_mois);
    
    // Calculate price based on duration
    const montant = duration === 1 
      ? membershipData.prix_mensuel 
      : membershipData.prix_3_mois;
    
    // Calculate total services
    const services_total = membershipData.services_par_mois * duration;
    
    // Calculate dates
    const date_debut = new Date();
    const date_fin = new Date(date_debut);
    date_fin.setMonth(date_fin.getMonth() + duration);
    
    // Insert client membership
    const insertQuery = `
      INSERT INTO client_memberships (
        client_id,
        membership_id,
        date_debut,
        date_fin,
        services_total,
        services_utilises,
        montant_paye,
        mode_paiement,
        statut
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'actif')
    `;
    
    const [result] = await connection.execute(insertQuery, [
      client_id,
      membership_id,
      date_debut,
      date_fin,
      services_total,
      montant,
      methode_paiement
    ]);
    
    await connection.commit();
    
    // Fetch the newly created membership with full details
    const [newMembership] = await connection.execute(`
      SELECT 
        cm.id,
        cm.client_id,
        c.nom AS client_nom,
        c.prenom AS client_prenom,
        c.email AS client_email,
        c.telephone AS client_telephone,
        cm.membership_id,
        m.nom AS membership_nom,
        m.services_par_mois,
        cm.date_debut,
        cm.date_fin,
        cm.services_total,
        cm.services_utilises,
        cm.services_restants,
        cm.montant_paye,
        cm.mode_paiement,
        cm.statut,
        cm.created_at
      FROM client_memberships cm
      JOIN clients c ON cm.client_id = c.id
      JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Abonnement créé avec succès',
      data: newMembership[0]
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating client membership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'abonnement',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Cancel client membership
router.put('/:id/cancel', authenticateAdmin, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const membershipId = req.params.id;
    
    // Check if membership exists and is active
    const [membership] = await connection.execute(
      `SELECT cm.*, c.nom AS client_nom, c.prenom AS client_prenom, m.nom AS membership_nom
       FROM client_memberships cm
       JOIN clients c ON cm.client_id = c.id
       JOIN memberships m ON cm.membership_id = m.id
       WHERE cm.id = ?`,
      [membershipId]
    );
    
    if (membership.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé'
      });
    }
    
    const membershipData = membership[0];
    
    if (membershipData.statut === 'annule') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cet abonnement est déjà annulé'
      });
    }
    
    // Update membership status to cancelled
    await connection.execute(
      `UPDATE client_memberships 
       SET statut = 'annule', 
           date_fin = CURDATE()
       WHERE id = ?`,
      [membershipId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Abonnement annulé avec succès',
      data: {
        id: membershipId,
        client: `${membershipData.client_prenom} ${membershipData.client_nom}`,
        membership: membershipData.membership_nom
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error cancelling client membership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de l\'abonnement',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * PUT /api/admin/client-memberships/:id/status
 * Update the status of a client membership
 */
router.put('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const membershipId = req.params.id;
    const { statut } = req.body;

    // Validate status
    const validStatuses = ['active', 'expired', 'cancelled', 'pending'];
    if (!validStatuses.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Les statuts valides sont: active, expired, cancelled, pending'
      });
    }

    // Check if membership exists
    const [membership] = await db.execute(
      `SELECT cm.*, c.nom AS client_nom, c.prenom AS client_prenom, m.nom AS membership_nom
       FROM client_memberships cm
       JOIN clients c ON cm.client_id = c.id
       JOIN memberships m ON cm.membership_id = m.id
       WHERE cm.id = ?`,
      [membershipId]
    );

    if (membership.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement non trouvé'
      });
    }

    const membershipData = membership[0];

    // Update membership status
    await db.execute(
      `UPDATE client_memberships
       SET statut = ?
       WHERE id = ?`,
      [statut, membershipId]
    );

    res.json({
      success: true,
      message: 'Statut de l\'abonnement mis à jour avec succès',
      data: {
        id: membershipId,
        client: `${membershipData.client_prenom} ${membershipData.client_nom}`,
        membership: membershipData.membership_nom,
        old_status: membershipData.statut,
        new_status: statut
      }
    });

  } catch (error) {
    console.error('Error updating client membership status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de l\'abonnement',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/client-memberships/scheduled/pending
 * Get all pending scheduled memberships for admin dashboard
 */
router.get('/scheduled/pending', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT
        cm.id,
        cm.client_id,
        c.prenom AS client_prenom,
        c.nom AS client_nom,
        c.email AS client_email,
        c.telephone AS client_telephone,
        cm.membership_id,
        m.nom AS membership_nom,
        m.services_par_mois,
        cm.duree_engagement AS duree_mois,
        cm.montant_paye AS montant_prevu,
        cm.statut,
        cm.notes,
        cm.date_creation AS date_scheduled,
        cm.date_activated,
        cm.date_cancelled,
        cm.activated_by
      FROM client_memberships cm
      JOIN clients c ON cm.client_id = c.id
      JOIN memberships m ON cm.membership_id = m.id
      WHERE cm.statut = 'pending'
      ORDER BY cm.date_creation DESC
    `;

    const [pendingMemberships] = await db.execute(query);

    res.json({
      success: true,
      data: pendingMemberships
    });
  } catch (error) {
    console.error('Error fetching pending scheduled memberships:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des abonnements planifiés',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/client-memberships/scheduled/:id/activate
 * Activate a scheduled membership at the spa
 */
router.post('/scheduled/:id/activate', authenticateAdmin, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { methode_paiement } = req.body;
    const adminId = req.admin.id;

    if (!methode_paiement || !['cash', 'card', 'bank_transfer', 'online'].includes(methode_paiement)) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de paiement requise (cash, card, bank_transfer, online)'
      });
    }

    await connection.beginTransaction();

    // Check if scheduled membership exists and is pending
    const [scheduledCheck] = await connection.execute(
      'SELECT cm.*, c.prenom, c.nom, m.nom AS membership_nom FROM client_memberships cm JOIN clients c ON cm.client_id = c.id JOIN memberships m ON cm.membership_id = m.id WHERE cm.id = ? AND cm.statut = "pending"',
      [id]
    );

    if (scheduledCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Abonnement planifié non trouvé ou déjà activé'
      });
    }

    const scheduledData = scheduledCheck[0];

    // Check if client already has active membership
    const [activeCheck] = await connection.execute(
      'SELECT id FROM client_memberships WHERE client_id = ? AND statut = "active" AND date_fin >= CURDATE()',
      [scheduledData.client_id]
    );

    if (activeCheck.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le client a déjà un abonnement actif'
      });
    }

    // Update dates and activate membership
    const dateDebut = new Date().toISOString().split('T')[0]; // Today
    const dateFin = new Date(Date.now() + scheduledData.duree_engagement * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await connection.execute(
      `UPDATE client_memberships
       SET statut = 'active',
           date_debut = ?,
           date_fin = ?,
           date_activated = NOW(),
           activated_by = ?,
           mode_paiement = ?
       WHERE id = ?`,
      [dateDebut, dateFin, adminId, methode_paiement, id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Abonnement activé avec succès',
      data: {
        id: id,
        client: `${scheduledData.prenom} ${scheduledData.nom}`,
        membership: scheduledData.membership_nom,
        duree_mois: scheduledData.duree_engagement,
        montant_paye: scheduledData.montant_paye,
        mode_paiement: methode_paiement,
        date_debut: dateDebut,
        date_fin: dateFin
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error activating scheduled membership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de l\'abonnement',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * DELETE /api/admin/client-memberships/scheduled/:id
 * Cancel a scheduled membership (admin action)
 */
router.delete('/scheduled/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    // Check if scheduled membership exists and is pending
    const [scheduledCheck] = await db.execute(
      'SELECT cm.*, c.prenom, c.nom FROM client_memberships cm JOIN clients c ON cm.client_id = c.id WHERE cm.id = ? AND cm.statut = "pending"',
      [id]
    );

    if (scheduledCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Abonnement planifié non trouvé ou déjà traité'
      });
    }

    const scheduledData = scheduledCheck[0];

    // Update status to cancelled
    await db.execute(
      'UPDATE client_memberships SET statut = "cancelled", date_cancelled = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Abonnement planifié annulé avec succès',
      data: {
        id: id,
        client: `${scheduledData.prenom} ${scheduledData.nom}`
      }
    });

  } catch (error) {
    console.error('Error cancelling scheduled membership:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de l\'abonnement planifié',
      error: error.message
    });
  }
});

module.exports = router;
