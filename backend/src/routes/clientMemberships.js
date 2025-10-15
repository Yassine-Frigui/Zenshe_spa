const express = require('express');
const ClientMembershipModel = require('../models/ClientMembership');
const MembershipModel = require('../models/Membership');
const { authenticateClient } = require('../middleware/auth');
const router = express.Router();

// ============================================================================
// CLIENT ROUTES (require authentication)
// ============================================================================

// All routes require client authentication
router.use(authenticateClient);

/**
 * GET /api/client/memberships/active
 * Get client's currently active membership with localized content
 */
router.get('/active', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        const membership = await ClientMembershipModel.getActiveClientMembership(req.client.id, lang);
        
        res.json({
            success: true,
            data: membership,
            hasActiveMembership: !!membership,
            language: lang
        });
    } catch (error) {
        console.error('Error fetching active membership:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération de l\'abonnement actif',
            error: error.message 
        });
    }
});

/**
 * GET /api/client/memberships/history
 * Get client's membership history with localized content
 */
router.get('/history', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        const history = await ClientMembershipModel.getClientMembershipHistory(req.client.id, lang);
        
        res.json({ 
            success: true, 
            data: history,
            total: history.length,
            language: lang
        });
    } catch (error) {
        console.error('Error fetching membership history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération de l\'historique des abonnements',
            error: error.message 
        });
    }
});

/**
 * GET /api/client/memberships/available
 * Get all available memberships for purchase/scheduling with localized content
 */
router.get('/available', async (req, res) => {
    try {
        const db = require('../../config/database');
        const { lang = 'fr' } = req.query;
        
        console.log('📥 GET /api/client/memberships/available called with lang:', lang);
        
        // Query with LEFT JOIN for localized content
        const query = `
            SELECT 
                m.id,
                COALESCE(mt_lang.nom, mt_default.nom, m.nom) AS nom,
                COALESCE(mt_lang.description, mt_default.description, m.description) AS description,
                COALESCE(mt_lang.avantages, mt_default.avantages, m.avantages) AS avantages,
                m.prix_mensuel,
                m.prix_3_mois,
                m.services_par_mois,
                m.actif
            FROM memberships m
            LEFT JOIN memberships_translations mt_lang 
                ON mt_lang.membership_id = m.id AND mt_lang.language_code = ?
            LEFT JOIN memberships_translations mt_default 
                ON mt_default.membership_id = m.id AND mt_default.language_code = 'fr'
            WHERE m.actif = 1
            ORDER BY m.prix_mensuel ASC
        `;
        
        const [memberships] = await db.execute(query, [lang]);
        
        console.log('✅ Found', memberships.length, 'available memberships with language:', lang);
        
        res.json({
            success: true,
            memberships: memberships,
            language: lang
        });
    } catch (error) {
        console.error('Error fetching available memberships:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des abonnements disponibles',
            error: error.message
        });
    }
});

/**
 * POST /api/client/memberships/purchase
 * Purchase a membership
 */
router.post('/purchase', async (req, res) => {
    try {
        const { membershipId, paymentData } = req.body;
        
        if (!membershipId || !paymentData) {
            return res.status(400).json({
                success: false,
                message: 'ID d\'abonnement et données de paiement requis'
            });
        }

        // Verify membership exists and is active
        const membership = await MembershipModel.getMembershipById(membershipId);
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé'
            });
        }

        // Purchase membership
        const result = await ClientMembershipModel.purchaseMembership(
            req.client.id,
            membershipId,
            paymentData
        );

        res.status(201).json({
            success: true,
            message: result.message || 'Abonnement activé avec succès',
            clientMembershipId: result.id
        });
    } catch (error) {
        console.error('Error purchasing membership:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'achat de l\'abonnement',
            error: error.message 
        });
    }
});

/**
 * PUT /api/client/memberships/:id/cancel
 * Cancel a membership
 */
router.put('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify ownership
        const membership = await ClientMembershipModel.getActiveClientMembership(req.client.id);
        if (!membership || membership.id != id) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas accès à cet abonnement'
            });
        }

        await ClientMembershipModel.cancelMembership(id);
        
        res.json({
            success: true,
            message: 'Abonnement annulé avec succès'
        });
    } catch (error) {
        console.error('Error cancelling membership:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'annulation de l\'abonnement',
            error: error.message 
        });
    }
});

/**
 * POST /api/client/memberships/schedule
 * Schedule a membership for future activation (pending status)
 */
router.post('/schedule', async (req, res) => {
    const db = require('../../config/database');
    
    try {
        const { membership_id, duree_mois } = req.body;
        const clientId = req.client.id;
        
        // Validation
        if (!membership_id || !duree_mois) {
            return res.status(400).json({
                success: false,
                message: 'ID d\'abonnement et durée requis'
            });
        }
        
        // Validate duration
        if (![1, 3].includes(parseInt(duree_mois))) {
            return res.status(400).json({
                success: false,
                message: 'La durée doit être 1 ou 3 mois'
            });
        }
        
        // Check if client already has a pending scheduled membership
        const [existingScheduled] = await db.execute(
            'SELECT id FROM client_memberships WHERE client_id = ? AND statut = "pending"',
            [clientId]
        );
        
        if (existingScheduled.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà un abonnement planifié en attente. Visitez le spa pour l\'activer ou annulez-le d\'abord.'
            });
        }
        
        // Check if client already has an active membership
        const [activeMembership] = await db.execute(
            'SELECT id FROM client_memberships WHERE client_id = ? AND statut = "active" AND date_fin >= CURDATE()',
            [clientId]
        );
        
        if (activeMembership.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà un abonnement actif'
            });
        }
        
        // Get membership details
        const [membership] = await db.execute(
            'SELECT * FROM memberships WHERE id = ? AND actif = 1',
            [membership_id]
        );
        
        if (membership.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé ou inactif'
            });
        }
        
        const membershipData = membership[0];
        const duration = parseInt(duree_mois);
        
        // Calculate expected price and services
        const montant_prevu = duration === 1 
            ? membershipData.prix_mensuel 
            : membershipData.prix_3_mois;
        
        const services_total = membershipData.services_par_mois * duration;
        
        // Calculate dates (will be updated when activated)
        const date_debut = new Date().toISOString().split('T')[0]; // Today
        const date_fin = new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Approximate end date
        
        // Insert scheduled membership into client_memberships table
        const [result] = await db.execute(
            `INSERT INTO client_memberships (
                client_id, 
                membership_id, 
                date_debut,
                date_fin,
                montant_paye, 
                mode_paiement,
                duree_engagement,
                services_total,
                statut,
                notes
            ) VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, ?, 'pending', ?)`,
            [clientId, membership_id, date_debut, date_fin, montant_prevu, duration, services_total, 'Scheduled membership - to be activated at spa visit']
        );
        
        res.status(201).json({
            success: true,
            message: 'Abonnement planifié avec succès. Visitez-nous au spa pour l\'activer!',
            data: {
                id: result.insertId,
                membership_nom: membershipData.nom,
                duree_mois: duration,
                montant_prevu: montant_prevu
            }
        });
    } catch (error) {
        console.error('Error scheduling membership:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la planification de l\'abonnement',
            error: error.message
        });
    }
});

/**
 * GET /api/client/memberships/pending
 * Get client's pending scheduled membership
 */
router.get('/pending', async (req, res) => {
    const db = require('../../config/database');
    
    try {
        const clientId = req.client.id;
        
        const [scheduled] = await db.execute(
            `SELECT 
                cm.id,
                cm.client_id,
                cm.membership_id,
                cm.duree_engagement AS duree_mois,
                cm.montant_paye AS montant_prevu,
                cm.statut,
                cm.notes,
                cm.date_creation AS date_scheduled,
                m.nom AS membership_nom,
                m.services_par_mois
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            WHERE cm.client_id = ? AND cm.statut = 'pending'
            ORDER BY cm.date_creation DESC
            LIMIT 1`,
            [clientId]
        );
        
        res.json({
            success: true,
            data: scheduled.length > 0 ? scheduled[0] : null,
            hasPending: scheduled.length > 0
        });
    } catch (error) {
        console.error('Error fetching pending membership:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'abonnement planifié',
            error: error.message
        });
    }
});

/**
 * DELETE /api/client/memberships/scheduled/:id
 * Cancel a scheduled membership (before activation)
 */
router.delete('/scheduled/:id', async (req, res) => {
    const db = require('../../config/database');
    
    try {
        const { id } = req.params;
        const clientId = req.client.id;
        
        // Verify ownership and that it's still pending
        const [scheduled] = await db.execute(
            'SELECT * FROM client_memberships WHERE id = ? AND client_id = ? AND statut = "pending"',
            [id, clientId]
        );
        
        if (scheduled.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement planifié non trouvé ou déjà traité'
            });
        }
        
        // Update status to cancelled
        await db.execute(
            'UPDATE client_memberships SET statut = "cancelled", date_cancelled = NOW() WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Abonnement planifié annulé avec succès'
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
