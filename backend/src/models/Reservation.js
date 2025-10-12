const { executeQuery, executeTransaction } = require('../../config/database');

class ReservationModel {
    // ============================================================================
    // RESERVATION CRUD OPERATIONS
    // ============================================================================

    // Create a new reservation with items (SUPPORTS MULTI-SERVICE)
    static async createReservation(reservationData) {
        const {
            client_id,
            service_id,          // Legacy: single service (for backward compatibility)
            services = [],       // NEW: Array of {service_id, item_type, prix, notes}
            date_reservation,
            heure_debut,
            heure_fin,
            notes_client,
            prix_service,        // Legacy: single service price
            prix_final,          // Total price (sum of all services)
            statut = 'en_attente',
            reservation_status = 'reserved',
            reservation_items = [], // Alias for services
            // Client data for draft conversions or new clients
            client_nom,
            client_prenom,
            client_telephone,
            client_email,
            session_id,
            // Jotform submission data
            jotform_submission
        } = reservationData;

        // Determine if using new multi-service system
        const servicesList = services.length > 0 ? services : reservation_items;
        const usesItemsTable = servicesList.length > 0 ? 1 : 0;
        
        // Calculate prix_final if services array provided
        let finalPrice = prix_final;
        if (usesItemsTable && !finalPrice) {
            finalPrice = servicesList.reduce((sum, s) => sum + parseFloat(s.prix || 0), 0);
        }

        // Prepare queries for transaction
        const queries = [];
        
        // Main reservation query (service_id becomes NULL for new system)
        const reservationQuery = `
            INSERT INTO reservations 
            (client_id, service_id, date_reservation, heure_debut, heure_fin, 
             statut, reservation_status, prix_service, prix_final, notes_client,
             client_nom, client_prenom, client_telephone, client_email, session_id,
             referral_code_id, has_healing_addon, addon_price, jotform_submission, uses_items_table)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        queries.push({
            query: reservationQuery,
            params: [
                client_id, 
                usesItemsTable ? null : service_id,  // NULL if using items table
                date_reservation, 
                heure_debut, 
                heure_fin,
                statut || 'en_attente', 
                reservation_status || 'reserved', 
                usesItemsTable ? 0 : (prix_service || 0),  // 0 if using items table
                finalPrice || 0, 
                notes_client || null,
                client_nom || null,
                client_prenom || null,
                client_telephone || null,
                client_email || null,
                session_id || null,
                reservationData.referral_code_id || null,
                reservationData.has_healing_addon || false,
                reservationData.addon_price || 0.00,
                jotform_submission ? JSON.stringify(jotform_submission) : null,
                usesItemsTable
            ]
        });

        // Execute transaction to get reservation ID
        const results = await executeTransaction(queries);
        const reservationId = results[0].insertId;

        // Insert reservation items if using new system
        if (usesItemsTable && servicesList.length > 0) {
            const itemQueries = servicesList.map(service => ({
                query: `
                    INSERT INTO reservation_items 
                    (reservation_id, service_id, item_type, prix, notes) 
                    VALUES (?, ?, ?, ?, ?)
                `,
                params: [
                    reservationId,
                    service.service_id,
                    service.item_type || 'main',
                    service.prix,
                    service.notes || null
                ]
            }));
            
            await executeTransaction(itemQueries);
        }

        return reservationId;
    }

    // Convert draft to confirmed reservation and create client if needed
    static async convertDraftToReservation(draftId) {
        return await executeTransaction(async (transaction) => {
            // Get draft data
            const draftQuery = `
                SELECT * FROM reservations 
                WHERE id = ? AND statut = 'draft'
            `;
            const draftResult = await transaction.query(draftQuery, [draftId]);
            
            if (!draftResult.length) {
                throw new Error('Draft reservation not found');
            }
            
            const draft = draftResult[0];
            let clientId = null;
            
            // Check if client exists by phone + name combination
            if (draft.client_telephone && draft.client_nom && draft.client_prenom) {
                const clientQuery = `
                    SELECT id FROM clients 
                    WHERE telephone = ? AND nom = ? AND prenom = ?
                `;
                const clientResult = await transaction.query(clientQuery, [
                    draft.client_telephone, draft.client_nom, draft.client_prenom
                ]);
                
                if (clientResult.length > 0) {
                    clientId = clientResult[0].id;
                } else {
                    // Create new client
                    const createClientQuery = `
                        INSERT INTO clients (nom, prenom, telephone, email, actif)
                        VALUES (?, ?, ?, ?, 1)
                    `;
                    const clientCreateResult = await transaction.query(createClientQuery, [
                        draft.client_nom, draft.client_prenom, draft.client_telephone, draft.client_email
                    ]);
                    clientId = clientCreateResult.insertId;
                }
            }
            
            // Get service price for pricing
            const serviceQuery = `SELECT prix FROM services WHERE id = ?`;
            const serviceResult = await transaction.query(serviceQuery, [draft.service_id]);
            const servicePrice = serviceResult[0]?.prix || 0;
            
            // Update draft to confirmed reservation
            const updateQuery = `
                UPDATE reservations 
                SET client_id = ?, 
                    statut = 'confirmee',
                    reservation_status = 'confirmed',
                    prix_service = ?,
                    prix_final = ?,
                    client_nom = NULL,
                    client_prenom = NULL,
                    client_telephone = NULL,
                    client_email = NULL,
                    session_id = NULL
                WHERE id = ?
            `;
            
            await transaction.query(updateQuery, [
                clientId, servicePrice, servicePrice, draftId
            ]);
            
            return draftId;
        });
    }

    // Get reservation by ID with all related data (SUPPORTS MULTI-SERVICE)
    static async getReservationById(id) {
        const query = `
            SELECT 
                r.*,
                CONCAT(c.prenom, ' ', c.nom) as client_nom,
                c.email as client_email,
                c.telephone as client_telephone,
                s.nom as service_nom,
                s.description as service_description,
                s.duree as service_duree,
                s.prix as service_prix
            FROM reservations r
            LEFT JOIN clients c ON r.client_id = c.id
            LEFT JOIN services s ON r.service_id = s.id
            WHERE r.id = ?
        `;
        const result = await executeQuery(query, [id]);
        const reservation = result[0];

        if (!reservation) return null;
        
        // If using new multi-service system, fetch items
        if (reservation.uses_items_table) {
            const itemsQuery = `
                SELECT 
                    ri.*,
                    s.nom as service_nom,
                    s.description as service_description,
                    s.duree as service_duree,
                    cat.nom as categorie_nom,
                    cat.couleur_theme as categorie_couleur
                FROM reservation_items ri
                JOIN services s ON ri.service_id = s.id
                LEFT JOIN categories_services cat ON s.categorie_id = cat.id
                WHERE ri.reservation_id = ?
                ORDER BY ri.item_type, ri.id
            `;
            const items = await executeQuery(itemsQuery, [id]);
            reservation.items = items;
            
            // Calculate totals from items
            reservation.total_duration = items.reduce((sum, item) => sum + (item.service_duree || 0), 0);
            reservation.service_count = items.length;
        }

        // Parse jotform_submission if it exists
        if (reservation.jotform_submission) {
            try {
                reservation.jotform_submission = JSON.parse(reservation.jotform_submission);
            } catch (error) {
                console.error('Error parsing jotform_submission:', error);
                reservation.jotform_submission = null;
            }
        }

        return reservation;
    }
    
    // NEW: Get reservation with detailed items (multilingual support)
    static async getReservationWithItems(id, language = 'fr') {
        const query = `
            SELECT 
                r.*,
                c.prenom as client_prenom,
                c.nom as client_nom_famille,
                c.email as client_email,
                c.telephone as client_telephone
            FROM reservations r
            LEFT JOIN clients c ON r.client_id = c.id
            WHERE r.id = ?
        `;
        
        const result = await executeQuery(query, [id]);
        const reservation = result[0];
        
        if (!reservation) return null;
        
        // Get reservation items with service details and translations
        if (reservation.uses_items_table) {
            const itemsQuery = `
                SELECT 
                    ri.*,
                    s.duree as service_duree,
                    s.categorie_id,
                    COALESCE(st.nom, st_fr.nom, s.nom) as service_nom,
                    COALESCE(st.description, st_fr.description, s.description) as service_description,
                    COALESCE(ct.nom, ct_fr.nom, cat.nom) as categorie_nom,
                    cat.couleur_theme as categorie_couleur
                FROM reservation_items ri
                JOIN services s ON ri.service_id = s.id
                LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
                LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
                LEFT JOIN categories_services cat ON s.categorie_id = cat.id
                LEFT JOIN categories_services_translations ct ON cat.id = ct.category_id AND ct.language_code = ?
                LEFT JOIN categories_services_translations ct_fr ON cat.id = ct_fr.category_id AND ct_fr.language_code = 'fr'
                WHERE ri.reservation_id = ?
                ORDER BY 
                    CASE WHEN ri.item_type = 'main' THEN 1 ELSE 2 END,
                    ri.id
            `;
            
            const items = await executeQuery(itemsQuery, [language, language, id]);
            reservation.items = items;
            
            // Calculate totals
            reservation.total_duration = items.reduce((sum, item) => sum + (parseInt(item.service_duree) || 0), 0);
            reservation.service_count = items.length;
            reservation.main_services_count = items.filter(i => i.item_type === 'main').length;
            reservation.addon_services_count = items.filter(i => i.item_type === 'addon').length;
        } else {
            // Legacy single-service mode
            const serviceQuery = `
                SELECT 
                    s.id as service_id,
                    s.duree as service_duree,
                    COALESCE(st.nom, st_fr.nom, s.nom) as service_nom,
                    COALESCE(st.description, st_fr.description, s.description) as service_description,
                    s.prix,
                    'main' as item_type
                FROM services s
                LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
                LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
                WHERE s.id = ?
            `;
            
            if (reservation.service_id) {
                const serviceData = await executeQuery(serviceQuery, [language, reservation.service_id]);
                reservation.items = serviceData;
                reservation.service_count = 1;
            } else {
                reservation.items = [];
                reservation.service_count = 0;
            }
        }
        
        // Parse jotform_submission
        if (reservation.jotform_submission) {
            try {
                reservation.jotform_submission = JSON.parse(reservation.jotform_submission);
            } catch (error) {
                console.error('Error parsing jotform_submission:', error);
                reservation.jotform_submission = null;
            }
        }
        
        return reservation;
    }

    // Get reservations with filters
    static async getReservations(filters = {}) {
        let whereConditions = [];
        let params = [];
        
        // Date filters
        if (filters.date_debut && filters.date_fin) {
            whereConditions.push('r.date_reservation BETWEEN ? AND ?');
            params.push(filters.date_debut, filters.date_fin);
        } else if (filters.date) {
            whereConditions.push('r.date_reservation = ?');
            params.push(filters.date);
        }
        
        // Status filters
        if (filters.statut) {
            whereConditions.push('r.statut = ?');
            params.push(filters.statut);
        }
        
        if (filters.reservation_status) {
            whereConditions.push('r.reservation_status = ?');
            params.push(filters.reservation_status);
        }
        
        // Client filter
        if (filters.client_id) {
            whereConditions.push('r.client_id = ?');
            params.push(filters.client_id);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const query = `
            SELECT 
                r.id,
                r.date_reservation,
                r.heure_debut,
                r.heure_fin,
                r.statut,
                r.reservation_status,
                r.prix_service,
                r.prix_final,
                r.notes_client,
                r.date_creation,
                r.session_id,
                r.couleurs_choisies,
                r.jotform_submission_id,
                -- For regular reservations, use client table data
                CASE 
                    WHEN r.client_id IS NOT NULL THEN CONCAT(c.prenom, ' ', c.nom)
                    ELSE CONCAT(COALESCE(r.client_prenom, ''), ' ', COALESCE(r.client_nom, ''))
                END as client_nom,
                CASE 
                    WHEN r.client_id IS NOT NULL THEN c.telephone
                    ELSE r.client_telephone
                END as client_telephone,
                CASE 
                    WHEN r.client_id IS NOT NULL THEN c.email
                    ELSE r.client_email
                END as client_email,
                s.nom as service_nom,
                s.duree as service_duree,
                s.service_type,
                s.prix as service_prix,
                r.client_id
            FROM reservations r
            LEFT JOIN clients c ON r.client_id = c.id
            JOIN services s ON r.service_id = s.id
            ${whereClause}
            ORDER BY r.date_reservation DESC, r.heure_debut ASC
        `;
        
        const results = await executeQuery(query, params);
        
        // Add is_draft flag based on statut
        return results.map(reservation => ({
            ...reservation,
            is_draft: reservation.statut === 'draft'
        }));
    }

    // Get today's reservations
    static async getTodayReservations() {
        const today = new Date().toISOString().split('T')[0];
        return await this.getReservations({ date: today });
    }

    // Get week's reservations
    static async getWeekReservations() {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));
        
        return await this.getReservations({
            date_debut: startOfWeek.toISOString().split('T')[0],
            date_fin: endOfWeek.toISOString().split('T')[0]
        });
    }

    // Update reservation status
    static async updateReservationStatus(id, statut, notes_admin = null) {
        console.log(`🔄 Updating reservation ${id} from status to ${statut}`);
        
        // Get current reservation details first
        const reservationQuery = 'SELECT * FROM reservations WHERE id = ?';
        const reservationResult = await executeQuery(reservationQuery, [id]);
        
        if (!reservationResult.length) {
            throw new Error('Reservation not found');
        }
        
        const reservation = reservationResult[0];
        console.log(`📋 Current reservation:`, {
            id: reservation.id,
            current_statut: reservation.statut,
            service_id: reservation.service_id,
            prix_final: reservation.prix_final,
            prix_service: reservation.prix_service
        });
        
        let updateFields = ['statut = ?'];
        let params = [statut];
        
        // If changing from draft/en_attente to confirmee/terminee, recalculate price
        const shouldRecalculatePrice = (reservation.statut === 'draft' || reservation.statut === 'en_attente') && 
            (statut === 'confirmee' || statut === 'terminee') && 
            (reservation.prix_final === 0 || reservation.prix_final === null || parseFloat(reservation.prix_final) === 0);
            
        console.log(`💰 Should recalculate price? ${shouldRecalculatePrice}`);
        console.log(`   - Current status: ${reservation.statut}, New status: ${statut}`);
        console.log(`   - Current prix_final: ${reservation.prix_final} (type: ${typeof reservation.prix_final})`);
        
        if (shouldRecalculatePrice) {
            // Get service price
            const serviceQuery = 'SELECT prix FROM services WHERE id = ?';
            const serviceResult = await executeQuery(serviceQuery, [reservation.service_id]);
            
            console.log(`🔍 Service query result:`, serviceResult);
            
            if (serviceResult.length > 0) {
                const servicePrice = serviceResult[0].prix;
                console.log(`💵 Service price found: ${servicePrice} (type: ${typeof servicePrice})`);
                updateFields.push('prix_service = ?', 'prix_final = ?');
                params.push(servicePrice, servicePrice);
                console.log(`📝 Will update with fields: ${updateFields.join(', ')}`);
                console.log(`📝 Parameters: ${JSON.stringify(params)}`);
            }
        }
        
        if (notes_admin) {
            updateFields.push('notes_admin = ?');
            params.push(notes_admin);
        }
        
        params.push(id);
        
        const query = `UPDATE reservations SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log(`🚀 Executing query: ${query}`);
        console.log(`🚀 With params: ${JSON.stringify(params)}`);
        
        const result = await executeQuery(query, params);
        console.log(`✅ Update result:`, result);
        
        return result;
    }

    // Update full reservation
    static async updateReservation(id, reservationData) {
        const {
            date_reservation,
            heure_debut,
            heure_fin,
            statut,
            notes_admin,
            couleurs_choisies,
            temps_reel,
            satisfaction_client,
            commentaire_client,
            reservation_items
        } = reservationData;

        return await executeTransaction(async (transaction) => {
            // Update main reservation
            const reservationQuery = `
                UPDATE reservations 
                SET date_reservation = ?, heure_debut = ?, heure_fin = ?, statut = ?,
                    notes_admin = ?, couleurs_choisies = ?, temps_reel = ?,
                    satisfaction_client = ?, commentaire_client = ?
                WHERE id = ?
            `;
            
            await transaction.query(reservationQuery, [
                date_reservation, heure_debut, heure_fin, statut,
                notes_admin, couleurs_choisies, temps_reel,
                satisfaction_client, commentaire_client, id
            ]);

            // Update reservation items if provided
            if (reservation_items) {
                // Delete existing items
                await transaction.query('DELETE FROM reservation_items WHERE reservation_id = ?', [id]);
                
                // Insert new items
                const itemsQuery = `
                    INSERT INTO reservation_items 
                    (reservation_id, service_id, item_type, quantite, prix_unitaire, prix_total)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                for (const item of reservation_items) {
                    await transaction.query(itemsQuery, [
                        id,
                        item.service_id,
                        item.item_type || 'main',
                        item.quantite || 1,
                        item.prix_unitaire,
                        item.prix_total
                    ]);
                }
            }

            return true;
        });
    }

    // Delete reservation
    static async deleteReservation(id) {
        return await executeTransaction(async (transaction) => {
            // Delete reservation items first
            await transaction.query('DELETE FROM reservation_items WHERE reservation_id = ?', [id]);
            
            // Delete reservation
            await transaction.query('DELETE FROM reservations WHERE id = ?', [id]);
            
            return true;
        });
    }

    // ============================================================================
    // AVAILABILITY AND SCHEDULING
    // ============================================================================

    // Check time slot availability
    static async checkAvailability(date, heure_debut, heure_fin, excludeReservationId = null) {
        // First, let's check what reservations exist for this date
        const existingQuery = `
            SELECT id, heure_debut, heure_fin, statut, reservation_status, notes_client
            FROM reservations 
            WHERE date_reservation = ?
        `;
        const existingReservations = await executeQuery(existingQuery, [date]);
        console.log('🔍 All reservations for', date, ':', existingReservations);
        
        // Check specifically for conflicts
        let query = `
            SELECT id, heure_debut, heure_fin, statut, reservation_status
            FROM reservations 
            WHERE date_reservation = ? 
            AND statut NOT IN ('annulee', 'no_show', 'draft')
            AND reservation_status NOT IN ('draft', 'cancelled')
            AND (
                (heure_debut <= ? AND heure_fin > ?) OR
                (heure_debut < ? AND heure_fin >= ?) OR
                (heure_debut >= ? AND heure_fin <= ?)
            )
        `;
        let params = [date, heure_debut, heure_debut, heure_fin, heure_fin, heure_debut, heure_fin];
        
        if (excludeReservationId) {
            query += ' AND id != ?';
            params.push(excludeReservationId);
        }
        
        console.log('🕒 Checking availability for:', { date, heure_debut, heure_fin });
        console.log('📋 Conflict check query:', query);
        console.log('📋 Params:', params);
        
        const conflicts = await executeQuery(query, params);
        console.log('⚠️ Found conflicts:', conflicts);
        
        if (conflicts.length > 0) {
            console.log('❌ Time slot NOT available due to conflicts:', conflicts);
            return false;
        }
        
        console.log('✅ Time slot is available');
        return true;
    }

    // Get available time slots for a date
    static async getAvailableSlots(date, serviceDuration) {
        // Get opening hours for the day
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayOfWeek = dayNames[new Date(date).getDay()];
        
        const openingHoursQuery = `
            SELECT heure_debut, heure_fin 
            FROM creneaux_horaires 
            WHERE jour_semaine = ? AND actif = TRUE
        `;
        const openingHours = await executeQuery(openingHoursQuery, [dayOfWeek]);
        
        if (!openingHours.length) {
            return []; // Closed on this day
        }
        
        // Get existing reservations for this date
        const reservationsQuery = `
            SELECT heure_debut, heure_fin 
            FROM reservations 
            WHERE date_reservation = ? AND statut NOT IN ('annulee', 'no_show')
            ORDER BY heure_debut
        `;
        const existingReservations = await executeQuery(reservationsQuery, [date]);
        
        // Calculate available slots
        const availableSlots = [];
        const { heure_debut: openTime, heure_fin: closeTime } = openingHours[0];
        
        // This would need more complex implementation for complete functionality
        // For now, return basic structure
        return availableSlots;
    }

    // ============================================================================
    // STATISTICS AND REPORTING
    // ============================================================================

    // Get reservation statistics
    static async getReservationStats(dateDebut, dateFin) {
        const queries = [
            // Total reservations
            `SELECT COUNT(*) as total FROM reservations WHERE date_reservation BETWEEN ? AND ?`,
            
            // Reservations by status
            `SELECT statut, COUNT(*) as nombre FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? 
             GROUP BY statut`,
            
            // Revenue
            `SELECT SUM(prix_final) as chiffre_affaires FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? AND statut = 'terminee'`,
            
            // Average satisfaction
            `SELECT AVG(satisfaction_client) as satisfaction_moyenne FROM reservations 
             WHERE date_reservation BETWEEN ? AND ? AND satisfaction_client IS NOT NULL`,
            
            // Most popular services
            `SELECT s.nom, COUNT(*) as nombre FROM reservations r
             JOIN services s ON r.service_id = s.id
             WHERE r.date_reservation BETWEEN ? AND ?
             GROUP BY s.id, s.nom
             ORDER BY nombre DESC LIMIT 5`
        ];
        
        const results = await Promise.all(
            queries.map(query => executeQuery(query, [dateDebut, dateFin]))
        );
        
        return {
            total_reservations: results[0][0].total,
            reservations_par_statut: results[1],
            chiffre_affaires: results[2][0].chiffre_affaires || 0,
            satisfaction_moyenne: results[3][0].satisfaction_moyenne || 0,
            services_populaires: results[4]
        };
    }

    // Get reservation statistics by service type
    static async getServiceTypeStats(dateDebut, dateFin) {
        const query = `
            SELECT 
                s.service_type,
                COUNT(*) as nombre_reservations,
                SUM(r.prix_final) as chiffre_affaires,
                AVG(r.satisfaction_client) as satisfaction_moyenne
            FROM reservations r
            JOIN services s ON r.service_id = s.id
            WHERE r.date_reservation BETWEEN ? AND ?
            GROUP BY s.service_type
            ORDER BY nombre_reservations DESC
        `;
        
        return await executeQuery(query, [dateDebut, dateFin]);
    }

    // ============================================================================
    // ADDON MANAGEMENT
    // ============================================================================

    // Add addon to reservation
    static async addAddonToReservation(reservationId, serviceId, quantite = 1) {
        // Get addon service info
        const addonQuery = `
            SELECT nom, prix, service_type 
            FROM services 
            WHERE id = ? AND service_type = 'addon' AND actif = TRUE
        `;
        const addonResult = await executeQuery(addonQuery, [serviceId]);
        
        if (!addonResult.length) {
            throw new Error('Service addon non trouvé ou inactif');
        }
        
        const addon = addonResult[0];
        const prixTotal = addon.prix * quantite;

        return await executeTransaction(async (transaction) => {
            // Add reservation item
            const itemQuery = `
                INSERT INTO reservation_items 
                (reservation_id, service_id, item_type, prix, notes)
                VALUES (?, ?, 'addon', ?, ?)
            `;
            
            await transaction.query(itemQuery, [
                reservationId, serviceId, prixTotal, `Quantité: ${quantite}`
            ]);

            // Update reservation totals - calculate total from all items
            const totalQuery = `
                SELECT SUM(prix) as total_addons 
                FROM reservation_items 
                WHERE reservation_id = ? AND item_type = 'addon'
            `;
            
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalAddons = totalResult[0].total_addons || 0;
            
            // Get the base service price
            const baseQuery = `
                SELECT prix_service 
                FROM reservations 
                WHERE id = ?
            `;
            
            const baseResult = await transaction.query(baseQuery, [reservationId]);
            const prixService = baseResult[0].prix_service;
            
            // Update reservation final price
            const updateQuery = `
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `;
            
            await transaction.query(updateQuery, [prixService + totalAddons, reservationId]);

            return true;
        });
    }

    // Remove addon from reservation
    static async removeAddonFromReservation(reservationId, serviceId) {
        return await executeTransaction(async (transaction) => {
            // Get addon price
            const addonQuery = `
                SELECT prix 
                FROM reservation_items 
                WHERE reservation_id = ? AND service_id = ? AND item_type = 'addon'
            `;
            const addonResult = await transaction.query(addonQuery, [reservationId, serviceId]);
            
            if (!addonResult.length) {
                throw new Error('Addon non trouvé dans cette réservation');
            }

            // Remove reservation item
            await transaction.query(`
                DELETE FROM reservation_items 
                WHERE reservation_id = ? AND service_id = ? AND item_type = 'addon'
            `, [reservationId, serviceId]);

            // Recalculate totals from remaining items
            const totalQuery = `
                SELECT SUM(prix) as total_addons 
                FROM reservation_items 
                WHERE reservation_id = ? AND item_type = 'addon'
            `;
            
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalAddons = totalResult[0].total_addons || 0;
            
            // Get the base service price
            const baseQuery = `
                SELECT prix_service 
                FROM reservations 
                WHERE id = ?
            `;
            
            const baseResult = await transaction.query(baseQuery, [reservationId]);
            const prixService = baseResult[0].prix_service;
            
            // Update reservation final price
            await transaction.query(`
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `, [prixService + totalAddons, reservationId]);

            return true;
        });
    }

    // Get all addons for a reservation
    static async getReservationAddons(reservationId) {
        const query = `
            SELECT 
                ri.*,
                s.nom as service_nom,
                s.description as service_description
            FROM reservation_items ri
            JOIN services s ON ri.service_id = s.id
            WHERE ri.reservation_id = ? AND ri.item_type = 'addon'
            ORDER BY ri.id
        `;
        
        return await executeQuery(query, [reservationId]);
    }
    
    // ============================================================================
    // NEW: MULTI-SERVICE HELPER METHODS
    // ============================================================================
    
    // Calculate total duration for multiple services
    static async calculateTotalDuration(serviceIds) {
        if (!serviceIds || serviceIds.length === 0) return 0;
        
        const placeholders = serviceIds.map(() => '?').join(',');
        const query = `
            SELECT SUM(duree) as total_duration 
            FROM services 
            WHERE id IN (${placeholders}) AND actif = 1
        `;
        
        const result = await executeQuery(query, serviceIds);
        return result[0]?.total_duration || 0;
    }
    
    // Add service to existing reservation
    static async addServiceToReservation(reservationId, serviceData) {
        const { service_id, item_type = 'main', prix, notes = null } = serviceData;
        
        // Get service details
        const serviceQuery = `
            SELECT nom, prix as default_prix, duree 
            FROM services 
            WHERE id = ? AND actif = TRUE
        `;
        const serviceResult = await executeQuery(serviceQuery, [service_id]);
        
        if (!serviceResult.length) {
            throw new Error('Service non trouvé ou inactif');
        }
        
        const service = serviceResult[0];
        const finalPrice = prix || service.default_prix;
        
        return await executeTransaction(async (transaction) => {
            // Insert reservation item
            await transaction.query(`
                INSERT INTO reservation_items 
                (reservation_id, service_id, item_type, prix, notes)
                VALUES (?, ?, ?, ?, ?)
            `, [reservationId, service_id, item_type, finalPrice, notes]);
            
            // Update reservation to use items table
            await transaction.query(`
                UPDATE reservations 
                SET uses_items_table = 1
                WHERE id = ?
            `, [reservationId]);
            
            // Recalculate total price
            const totalQuery = `
                SELECT SUM(prix) as total_prix 
                FROM reservation_items 
                WHERE reservation_id = ?
            `;
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalPrice = totalResult[0]?.total_prix || 0;
            
            // Update reservation final price
            await transaction.query(`
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `, [totalPrice, reservationId]);
            
            return true;
        });
    }
    
    // Remove service from reservation
    static async removeServiceFromReservation(reservationId, serviceId, itemType = null) {
        return await executeTransaction(async (transaction) => {
            // Build query with optional item_type filter
            let deleteQuery = `
                DELETE FROM reservation_items 
                WHERE reservation_id = ? AND service_id = ?
            `;
            const params = [reservationId, serviceId];
            
            if (itemType) {
                deleteQuery += ' AND item_type = ?';
                params.push(itemType);
            }
            
            await transaction.query(deleteQuery, params);
            
            // Recalculate total price
            const totalQuery = `
                SELECT SUM(prix) as total_prix 
                FROM reservation_items 
                WHERE reservation_id = ?
            `;
            const totalResult = await transaction.query(totalQuery, [reservationId]);
            const totalPrice = totalResult[0]?.total_prix || 0;
            
            // Update reservation
            await transaction.query(`
                UPDATE reservations 
                SET prix_final = ?
                WHERE id = ?
            `, [totalPrice, reservationId]);
            
            return true;
        });
    }
    
    // Update reservation time slot based on all services
    static async updateReservationTimeSlot(reservationId, heureDebut) {
        const reservation = await this.getReservationWithItems(reservationId);
        
        if (!reservation) {
            throw new Error('Réservation non trouvée');
        }
        
        const totalDuration = reservation.total_duration || 0;
        
        // Calculate end time
        const [hours, minutes] = heureDebut.split(':');
        const startDate = new Date();
        startDate.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const endDate = new Date(startDate.getTime() + totalDuration * 60000);
        const heureFin = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        
        // Update reservation
        await executeQuery(`
            UPDATE reservations 
            SET heure_debut = ?, heure_fin = ?
            WHERE id = ?
        `, [heureDebut, heureFin, reservationId]);
        
        return { heure_debut: heureDebut, heure_fin: heureFin, total_duration: totalDuration };
    }
    
    // Get all reservations with multi-service support
    static async getAllReservationsWithItems(filters = {}, language = 'fr') {
        let whereConditions = ['1=1'];
        let params = [];
        
        if (filters.date_debut && filters.date_fin) {
            whereConditions.push('r.date_reservation BETWEEN ? AND ?');
            params.push(filters.date_debut, filters.date_fin);
        } else if (filters.date) {
            whereConditions.push('r.date_reservation = ?');
            params.push(filters.date);
        }
        
        if (filters.statut) {
            whereConditions.push('r.statut = ?');
            params.push(filters.statut);
        }
        
        if (filters.client_id) {
            whereConditions.push('r.client_id = ?');
            params.push(filters.client_id);
        }
        
        const query = `
            SELECT 
                r.id,
                r.date_reservation,
                r.heure_debut,
                r.heure_fin,
                r.statut,
                r.reservation_status,
                r.prix_final,
                r.uses_items_table,
                COALESCE(c.prenom, r.client_prenom) as client_prenom,
                COALESCE(c.nom, r.client_nom) as client_nom,
                COALESCE(c.telephone, r.client_telephone) as client_telephone,
                (SELECT COUNT(*) FROM reservation_items WHERE reservation_id = r.id) as service_count
            FROM reservations r
            LEFT JOIN clients c ON r.client_id = c.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY r.date_reservation DESC, r.heure_debut DESC
        `;
        
        const reservations = await executeQuery(query, params);
        
        // Fetch items for each reservation that uses items table
        for (const reservation of reservations) {
            if (reservation.uses_items_table) {
                const items = await executeQuery(`
                    SELECT 
                        ri.service_id,
                        ri.item_type,
                        ri.prix,
                        COALESCE(st.nom, st_fr.nom, s.nom) as service_nom,
                        s.duree as service_duree
                    FROM reservation_items ri
                    JOIN services s ON ri.service_id = s.id
                    LEFT JOIN services_translations st ON s.id = st.service_id AND st.language_code = ?
                    LEFT JOIN services_translations st_fr ON s.id = st_fr.service_id AND st_fr.language_code = 'fr'
                    WHERE ri.reservation_id = ?
                    ORDER BY ri.item_type, ri.id
                `, [language, reservation.id]);
                
                reservation.items = items;
            }
        }
        
        return reservations;
    }
}

module.exports = ReservationModel;
