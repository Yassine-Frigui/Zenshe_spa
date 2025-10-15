;const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * GET /api/admin/memberships/:id/translations
 * Get all translations for a specific membership
 */
router.get('/:id/translations', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First check if membership exists
        const [membership] = await db.execute(
            'SELECT id, nom FROM memberships WHERE id = ?',
            [id]
        );
        
        if (membership.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé'
            });
        }
        
        // Get all translations for this membership
        const [translations] = await db.execute(
            `SELECT 
                id,
                membership_id,
                language_code,
                nom,
                description,
                avantages,
                date_creation,
                date_modification
            FROM memberships_translations
            WHERE membership_id = ?
            ORDER BY language_code`,
            [id]
        );
        
        res.json({
            success: true,
            data: {
                membership: membership[0],
                translations: translations
            }
        });
    } catch (error) {
        console.error('Error fetching membership translations:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des traductions',
            error: error.message
        });
    }
});

/**
 * POST /api/admin/memberships/:id/translations
 * Create a new translation for a membership
 */
router.post('/:id/translations', async (req, res) => {
    try {
        const { id } = req.params;
        const { language_code, nom, description, avantages } = req.body;
        
        // Validation
        if (!language_code || !nom) {
            return res.status(400).json({
                success: false,
                message: 'Le code de langue et le nom sont requis'
            });
        }
        
        // Validate language code (fr, en, ar are common)
        const validLanguages = ['fr', 'en', 'ar', 'es', 'de', 'it'];
        if (!validLanguages.includes(language_code)) {
            return res.status(400).json({
                success: false,
                message: 'Code de langue invalide. Langues acceptées: ' + validLanguages.join(', ')
            });
        }
        
        // Check if membership exists
        const [membership] = await db.execute(
            'SELECT id FROM memberships WHERE id = ?',
            [id]
        );
        
        if (membership.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Abonnement non trouvé'
            });
        }
        
        // Check if translation already exists
        const [existing] = await db.execute(
            'SELECT id FROM memberships_translations WHERE membership_id = ? AND language_code = ?',
            [id, language_code]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Une traduction existe déjà pour cette langue'
            });
        }
        
        // Insert new translation
        const [result] = await db.execute(
            `INSERT INTO memberships_translations 
            (membership_id, language_code, nom, description, avantages, date_creation, date_modification) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, language_code, nom, description, avantages]
        );
        
        // Get the newly created translation
        const [newTranslation] = await db.execute(
            'SELECT * FROM memberships_translations WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Traduction créée avec succès',
            data: newTranslation[0]
        });
    } catch (error) {
        console.error('Error creating membership translation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la traduction',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/memberships/:id/translations/:language_code
 * Update an existing translation
 */
router.put('/:id/translations/:language_code', async (req, res) => {
    try {
        const { id, language_code } = req.params;
        const { nom, description, avantages } = req.body;
        
        // Validation
        if (!nom) {
            return res.status(400).json({
                success: false,
                message: 'Le nom est requis'
            });
        }
        
        // Check if translation exists
        const [existing] = await db.execute(
            'SELECT id FROM memberships_translations WHERE membership_id = ? AND language_code = ?',
            [id, language_code]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Traduction non trouvée'
            });
        }
        
        // Update translation
        await db.execute(
            `UPDATE memberships_translations 
            SET nom = ?, description = ?, avantages = ?, date_modification = NOW()
            WHERE membership_id = ? AND language_code = ?`,
            [nom, description, avantages, id, language_code]
        );
        
        // Get updated translation
        const [updated] = await db.execute(
            'SELECT * FROM memberships_translations WHERE membership_id = ? AND language_code = ?',
            [id, language_code]
        );
        
        res.json({
            success: true,
            message: 'Traduction mise à jour avec succès',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error updating membership translation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la traduction',
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/memberships/:id/translations/:language_code
 * Delete a translation
 */
router.delete('/:id/translations/:language_code', async (req, res) => {
    try {
        const { id, language_code } = req.params;
        
        // Prevent deletion of default language (fr)
        if (language_code === 'fr') {
            return res.status(403).json({
                success: false,
                message: 'La traduction française (langue par défaut) ne peut pas être supprimée'
            });
        }
        
        // Check if translation exists
        const [existing] = await db.execute(
            'SELECT id FROM memberships_translations WHERE membership_id = ? AND language_code = ?',
            [id, language_code]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Traduction non trouvée'
            });
        }
        
        // Delete translation
        await db.execute(
            'DELETE FROM memberships_translations WHERE membership_id = ? AND language_code = ?',
            [id, language_code]
        );
        
        res.json({
            success: true,
            message: 'Traduction supprimée avec succès'
        });
    } catch (error) {
        console.error('Error deleting membership translation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la traduction',
            error: error.message
        });
    }
});

module.exports = router;
