const { executeQuery } = require('../../config/database');
const TelegramService = require('./TelegramService');

class ReservationReminderService {
    constructor() {
        this.telegramService = TelegramService; // Already instantiated
        this.isRunning = false;
    }

    /**
     * Check for reservations that need reminders and send notifications
     */
    async checkAndSendReminders() {
        if (this.isRunning) {
            console.log('⏳ Reminder check already running, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            console.log('🔍 Checking for reservations needing reminders...');

            // Get reservations that are confirmed and past their start time, but haven't had reminders sent
            const query = `
                SELECT
                    r.id,
                    r.date_reservation,
                    r.heure_debut,
                    r.heure_fin,
                    r.statut,
                    CONCAT(c.prenom, ' ', c.nom) as client_nom,
                    c.telephone as client_telephone,
                    s.nom as service_nom,
                    s.duree
                FROM reservations r
                JOIN clients c ON r.client_id = c.id
                JOIN services s ON r.service_id = s.id
                WHERE r.statut = 'confirmee'
                AND r.reminder_sent = FALSE
                AND CONCAT(r.date_reservation, ' ', r.heure_debut) <= NOW()
                AND r.reservation_status != 'draft'
                ORDER BY r.date_reservation, r.heure_debut
            `;

            const reservations = await executeQuery(query);

            if (reservations.length === 0) {
                console.log('✅ No reservations need reminders');
                return;
            }

            console.log(`📢 Found ${reservations.length} reservation(s) needing reminders`);

            // Send reminders for each reservation
            for (const reservation of reservations) {
                await this.sendReminder(reservation);
                // Mark as reminder sent
                await this.markReminderSent(reservation.id);
            }

        } catch (error) {
            console.error('❌ Error in reminder check:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Send reminder notification for a reservation
     */
    async sendReminder(reservation) {
        try {
            const message = this.formatReminderMessage(reservation);
            const sent = await this.telegramService.sendMessage(message);

            if (sent) {
                console.log(`✅ Reminder sent for reservation ${reservation.id}`);
            } else {
                console.log(`❌ Failed to send reminder for reservation ${reservation.id}`);
            }

            return sent;
        } catch (error) {
            console.error(`❌ Error sending reminder for reservation ${reservation.id}:`, error);
            return false;
        }
    }

    /**
     * Format the reminder message for Telegram
     */
    formatReminderMessage(reservation) {
        const dateTime = new Date(`${reservation.date_reservation}T${reservation.heure_debut}`);
        const formattedDate = dateTime.toLocaleDateString('fr-FR');
        const formattedTime = dateTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `🔔 REMINDER: Reservation due now

👤 Client: ${reservation.client_nom}
📞 Phone: ${reservation.client_telephone}
💅 Service: ${reservation.service_nom}
📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
⏱️ Duration: ${reservation.duree} minutes

⚠️ Action needed: Mark as completed or no-show

Reservation ID: ${reservation.id}`;
    }

    /**
     * Mark that a reminder has been sent for a reservation
     */
    async markReminderSent(reservationId) {
        try {
            await executeQuery(
                'UPDATE reservations SET reminder_sent = TRUE, reminder_sent_at = NOW() WHERE id = ?',
                [reservationId]
            );
            console.log(`✅ Marked reminder sent for reservation ${reservationId}`);
        } catch (error) {
            console.error(`❌ Error marking reminder sent for reservation ${reservationId}:`, error);
        }
    }

    /**
     * Get pending action reservations (for dashboard)
     */
    async getPendingActionReservations() {
        try {
            const query = `
                SELECT
                    r.id,
                    r.date_reservation,
                    r.heure_debut,
                    r.heure_fin,
                    r.statut,
                    r.reminder_sent,
                    r.reminder_sent_at,
                    CONCAT(c.prenom, ' ', c.nom) as client_nom,
                    c.telephone as client_telephone,
                    s.nom as service_nom,
                    s.duree
                FROM reservations r
                JOIN clients c ON r.client_id = c.id
                JOIN services s ON r.service_id = s.id
                WHERE r.statut = 'confirmee'
                AND r.reminder_sent = TRUE
                AND r.reservation_status != 'draft'
                ORDER BY r.date_reservation DESC, r.heure_debut DESC
            `;

            const reservations = await executeQuery(query);
            return reservations;
        } catch (error) {
            console.error('❌ Error getting pending action reservations:', error);
            return [];
        }
    }
}

module.exports = ReservationReminderService;