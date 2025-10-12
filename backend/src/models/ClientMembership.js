const { executeQuery } = require('../../config/database');

class ClientMembershipModel {
    /**
     * Get active membership for a client
     * Returns the most recent active membership with remaining services
     */
    static async getActiveClientMembership(clientId) {
        const query = `
            SELECT 
                cm.*,
                m.nom as membership_nom,
                m.services_par_mois,
                m.description as membership_description,
                DATEDIFF(cm.date_fin, CURDATE()) as jours_restants
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            WHERE cm.client_id = ?
                AND cm.statut = 'active'
                AND cm.date_fin >= CURDATE()
                AND cm.services_restants > 0
            ORDER BY cm.date_fin DESC
            LIMIT 1
        `;
        const result = await executeQuery(query, [clientId]);
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
     */
    static async getClientMembershipHistory(clientId) {
        const query = `
            SELECT 
                cm.*,
                m.nom as membership_nom,
                m.prix_mensuel,
                m.description as membership_description
            FROM client_memberships cm
            JOIN memberships m ON cm.membership_id = m.id
            WHERE cm.client_id = ?
            ORDER BY cm.date_creation DESC
        `;
        return await executeQuery(query, [clientId]);
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
