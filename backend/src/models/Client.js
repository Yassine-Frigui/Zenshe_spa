const { executeQuery, executeTransaction } = require('../../config/database');
const ReferralCodeModel = require('./ReferralCode');

class ClientModel {
    // Generate a unique referral code
    static generateReferralCode(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Créer un nouveau client
    static async createClient(clientData) {
        const {
            nom,
            prenom,
            email,
            telephone,
            date_naissance,
            adresse,
            notes,
            mot_de_passe,
            email_verifie = false,
            statut = 'actif',
            langue_preferee = 'fr'
        } = clientData;

        return executeTransaction(async (connection) => {
            // Create the client first
            const clientQuery = `
                INSERT INTO clients 
                (nom, prenom, email, telephone, date_naissance, adresse, notes, 
                 mot_de_passe, email_verifie, statut, langue_preferee)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const clientResult = await connection(clientQuery, [
                nom || null, 
                prenom || null, 
                email || null, 
                telephone || null, 
                date_naissance || null, 
                adresse || null, 
                notes || null,
                mot_de_passe || null,
                email_verifie,
                statut,
                langue_preferee
            ]);

            const clientId = clientResult.insertId;

            // Generate unique referral code
            let referralCode;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                referralCode = this.generateReferralCode();
                const existing = await connection(
                    'SELECT id FROM referral_codes WHERE code = ?',
                    [referralCode]
                );
                isUnique = existing.length === 0;
                attempts++;
            }

            if (!isUnique) {
                throw new Error('Could not generate unique referral code');
            }

            // Create the referral code for this client
            await connection(
                `INSERT INTO referral_codes 
                 (code, owner_client_id, discount_percentage, max_uses, is_active) 
                 VALUES (?, ?, ?, ?, ?)`,
                [referralCode, clientId, 10.00, null, true]
            );

            return clientId;
        });
    }

    // Récupérer un client par ID
    static async getClientById(id) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, email_verifie, statut, langue_preferee,
                date_creation, actif, last_jotform_submission_id
            FROM clients 
            WHERE id = ? AND actif = TRUE
        `;
        const result = await executeQuery(query, [id]);
        return result[0];
    }

    // Récupérer un client par email
    static async getClientByEmail(email) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, date_creation, actif
            FROM clients 
            WHERE email = ? AND actif = TRUE
        `;
        const result = await executeQuery(query, [email]);
        return result[0];
    }

    // Récupérer un client par email (pour password reset - inclut les comptes inactifs)
    static async findByEmail(email) {
        const query = `
            SELECT 
                id, nom, prenom, email, telephone, date_naissance,
                adresse, notes, date_creation, actif
            FROM clients 
            WHERE email = ?
        `;
        const result = await executeQuery(query, [email]);
        return result[0];
    }

    // Récupérer tous les clients avec pagination
    static async getAllClients(page = 1, limit = 20, search = '') {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE actif = TRUE';
        let params = [];

        if (search) {
            whereClause += ` AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const query = `
            SELECT 
                c.id, c.nom, c.prenom, c.email, c.telephone, c.date_naissance,
                c.adresse, c.date_creation, c.statut,
                COUNT(DISTINCT CASE WHEN r.statut IN ('confirmee', 'terminee') THEN r.id END) as nombre_visites,
                COUNT(DISTINCT r.id) as nombre_reservations,
                COALESCE(SUM(CASE WHEN r.statut = 'terminee' THEN r.prix_final ELSE 0 END), 0) as total_depense,
                MAX(r.date_reservation) as derniere_visite
            FROM clients c
            LEFT JOIN reservations r ON c.id = r.client_id
            ${whereClause.replace('WHERE actif', 'WHERE c.actif').replace('AND (nom', 'AND (c.nom').replace('OR prenom', 'OR c.prenom').replace('OR email', 'OR c.email').replace('OR telephone', 'OR c.telephone')}
            GROUP BY c.id
            ORDER BY c.date_creation DESC
            LIMIT ? OFFSET ?
        `;
        
        params.push(limit, offset);
        return await executeQuery(query, params);
    }

    // Compter le nombre total de clients
    static async getClientCount(search = '') {
        let whereClause = 'WHERE actif = TRUE';
        let params = [];

        if (search) {
            whereClause += ` AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const query = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
        const result = await executeQuery(query, params);
        return result[0].total;
    }

    // Mettre à jour un client
    static async updateClient(id, clientData) {
        const {
            nom,
            prenom,
            email,
            telephone,
            date_naissance,
            adresse,
            notes,
            last_jotform_submission_id
        } = clientData;

        const query = `
            UPDATE clients 
            SET nom = ?, prenom = ?, email = ?, telephone = ?, date_naissance = ?,
                adresse = ?, notes = ?, last_jotform_submission_id = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        // Convert undefined to null for MySQL
        return await executeQuery(query, [
            nom || null, 
            prenom || null, 
            email || null, 
            telephone || null, 
            date_naissance || null,
            adresse || null, 
            notes || null,
            last_jotform_submission_id || null,
            id
        ]);
    }

    // Mettre à jour le dernier ID de soumission JotForm pour un client
    static async updateLastJotformSubmissionId(clientId, jotformSubmissionId) {
        const query = `
            UPDATE clients 
            SET last_jotform_submission_id = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await executeQuery(query, [jotformSubmissionId, clientId]);
    }

    // Supprimer un client (soft delete)
    static async deleteClient(id) {
        const query = 'UPDATE clients SET actif = FALSE WHERE id = ?';
        return await executeQuery(query, [id]);
    }

    // Vérifier si un email existe déjà
    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM clients WHERE email = ? AND actif = TRUE';
        let params = [email];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await executeQuery(query, params);
        return result.length > 0;
    }

    // Récupérer l'historique des réservations d'un client
    static async getClientReservations(clientId, limit = 10) {
        const query = `
            SELECT 
                r.id,
                r.date_reservation,
                r.heure_debut,
                r.heure_fin,
                r.statut,
                r.prix_final,
                r.notes_client,
                s.nom as service_nom,
                s.description as service_description
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.client_id = ?
            ORDER BY r.date_reservation DESC, r.heure_debut DESC
            LIMIT ?
        `;
        return await executeQuery(query, [clientId, limit]);
    }

    // Récupérer les statistiques d'un client
    static async getClientStats(clientId) {
        const queries = [
            // Nombre total de réservations
            `SELECT COUNT(*) as total_reservations FROM reservations WHERE client_id = ?`,
            
            // Nombre de réservations terminées
            `SELECT COUNT(*) as reservations_terminees FROM reservations WHERE client_id = ? AND statut = 'terminee'`,
            
            // Montant total dépensé
            `SELECT SUM(prix_final) as montant_total FROM reservations WHERE client_id = ? AND statut = 'terminee'`,
            
            // Service le plus réservé
            `SELECT s.nom, COUNT(*) as nombre FROM reservations r 
             JOIN services s ON r.service_id = s.id 
             WHERE r.client_id = ? 
             GROUP BY s.id, s.nom 
             ORDER BY nombre DESC LIMIT 1`
        ];

        const results = await Promise.all(
            queries.map(query => executeQuery(query, [clientId]))
        );

        return {
            total_reservations: results[0][0].total_reservations,
            reservations_terminees: results[1][0].reservations_terminees,
            montant_total: results[2][0].montant_total || 0,
            service_prefere: results[3][0] || null
        };
    }

    // Get client's referral code
    static async getClientReferralCode(clientId) {
        const query = `
            SELECT 
                id, code, discount_percentage, max_uses, 
                current_uses, is_active, created_at, expires_at
            FROM referral_codes 
            WHERE owner_client_id = ? 
            LIMIT 1
        `;
        const result = await executeQuery(query, [clientId]);
        return result[0] || null;
    }
}

module.exports = ClientModel;
