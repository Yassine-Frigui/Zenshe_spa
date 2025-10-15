const { executeQuery } = require('../../config/database');

class ClientMembershipModel {
    /**
     * Get active membership for a client
     * Returns the most recent active membership with remaining services
     * @param {number} clientId - Client ID
     * @param {string} lang - Language code (default: 'fr')
     */
    static async getActiveClientMembership(clientId, lang = 'fr') {
        const query = `
            SELECT 
                cm.*,
                COALESCE(mt_lang.nom, mt_default.nom, m.nom) as membership_nom,
                COALESCE(mt_lang.description, mt_default.description, m.description) as membership_description,
                COALESCE(mt_lang.avantages, mt_default.avantages, m.avantages) as membership_avantages,
                m.services_par_mois,
                DATEDIFF(cm.date_fin, CURDATE()) as jours_restants
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            LEFT JOIN memberships_translations mt_lang 
                ON mt_lang.membership_id = m.id AND mt_lang.language_code = ?
            LEFT JOIN memberships_translations mt_default 
                ON mt_default.membership_id = m.id AND mt_default.language_code = 'fr'
            WHERE cm.client_id = ?
                AND cm.statut = 'active'
                AND cm.date_fin >= CURDATE()
                AND cm.services_restants > 0
            ORDER BY cm.date_fin DESC
            LIMIT 1
        `;
        const result = await executeQuery(query, [lang, clientId]);
        return result[0] || null;
    }

    /**
     * Check if client has any active membership (boolean check)
     */
    static async hasActiveMembership(clientId) {
        const membership = await this.getActiveClientMembership(clientId);
        return !!membership;
    }

    /**
     * Purchase/subscribe to a membership
     */
    static async purchaseMembership(clientId, membershipId, paymentData) {
        const { montant, mode_paiement, duree_engagement = 1 } = paymentData;
        
        // Use stored procedure
        const query = `CALL sp_purchase_membership(?, ?, ?, ?, @membership_id, @message)`;
        await executeQuery(query, [clientId, membershipId, duree_engagement, mode_paiement]);
        
        // Get output variables
        const result = await executeQuery('SELECT @membership_id as id, @message as message');
        return result[0];
    }

    /**
     * Use membership service (decrement services_restants)
     * This is called when creating a reservation with membership
     */
    static async useMembershipService(clientMembershipId) {
        const query = `
            UPDATE client_memberships 
            SET services_utilises = services_utilises + 1,
                services_restants = services_restants - 1
            WHERE id = ? AND services_restants > 0
        `;
        return await executeQuery(query, [clientMembershipId]);
    }

    /**
     * Refund membership service (increment services_restants)
     * This is called when a membership reservation is cancelled
     */
    static async refundMembershipService(clientMembershipId) {
        const query = `
            UPDATE client_memberships 
            SET services_utilises = services_utilises - 1,
                services_restants = services_restants + 1
            WHERE id = ? AND services_utilises > 0
        `;
        return await executeQuery(query, [clientMembershipId]);
    }

    /**
     * Get client membership history (all memberships, active or not)
     * @param {number} clientId - Client ID
     * @param {string} lang - Language code (default: 'fr')
     */
    static async getClientMembershipHistory(clientId, lang = 'fr') {
        const query = `
            SELECT 
                cm.*,
                COALESCE(mt_lang.nom, mt_default.nom, m.nom) as membership_nom,
                COALESCE(mt_lang.description, mt_default.description, m.description) as membership_description,
                COALESCE(mt_lang.avantages, mt_default.avantages, m.avantages) as membership_avantages,
                m.prix_mensuel
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            LEFT JOIN memberships_translations mt_lang 
                ON mt_lang.membership_id = m.id AND mt_lang.language_code = ?
            LEFT JOIN memberships_translations mt_default 
                ON mt_default.membership_id = m.id AND mt_default.language_code = 'fr'
            WHERE cm.client_id = ?
            ORDER BY cm.date_creation DESC
        `;
        return await executeQuery(query, [lang, clientId]);
    }

    /**
     * Get all active memberships (admin view)
     */
    static async getAllActiveClientMemberships() {
        const query = `SELECT * FROM v_active_client_memberships`;
        return await executeQuery(query);
    }

    /**
     * Cancel a membership
     */
    static async cancelMembership(clientMembershipId) {
        const query = `
            UPDATE client_memberships 
            SET statut = 'cancelled'
            WHERE id = ?
        `;
        return await executeQuery(query, [clientMembershipId]);
    }

    /**
     * Auto-expire old memberships (run as cron job)
     */
    static async expireOldMemberships() {
        const query = `
            UPDATE client_memberships 
            SET statut = 'expired'
            WHERE statut = 'active' 
                AND date_fin < CURDATE()
        `;
        return await executeQuery(query);
    }
}

module.exports = ClientMembershipModel;
