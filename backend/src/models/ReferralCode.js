const db = require('../../config/database');

class ReferralCode {
  constructor() {
    // Empty constructor
  }

  // Generate a random referral code
  static generateCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create a new referral code for a client
  static async createReferralCode(ownerId, discountPercentage = 10.00, maxUses = null, expiresAt = null) {
    try {
      let code;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      // Generate unique code
      while (!isUnique && attempts < maxAttempts) {
        code = this.generateCode();
        const existing = await db.executeQuery(
          'SELECT id FROM referral_codes WHERE code = ?',
          [code]
        );
        isUnique = existing.length === 0;
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Could not generate unique referral code');
      }

      const result = await db.executeQuery(
        `INSERT INTO referral_codes 
         (code, owner_client_id, discount_percentage, max_uses, expires_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [code, ownerId, discountPercentage, maxUses, expiresAt]
      );

      return {
        id: result.insertId,
        code,
        owner_client_id: ownerId,
        discount_percentage: discountPercentage,
        max_uses: maxUses,
        current_uses: 0,
        is_active: true,
        expires_at: expiresAt
      };
    } catch (error) {
      console.error('Error creating referral code:', error);
      throw error;
    }
  }

  // Validate a referral code and check if it can be used by a specific client
  static async validateCode(code, clientId) {
    try {
      const codeData = await db.executeQuery(
        `SELECT rc.*, c.nom as owner_name, c.email as owner_email
         FROM referral_codes rc 
         JOIN clients c ON rc.owner_client_id = c.id 
         WHERE rc.code = ? AND rc.is_active = TRUE`,
        [code]
      );

      if (codeData.length === 0) {
        return { valid: false, reason: 'Code not found or inactive' };
      }

      const referralCode = codeData[0];

      // Check if code has expired
      if (referralCode.expires_at && new Date() > new Date(referralCode.expires_at)) {
        return { valid: false, reason: 'Code has expired' };
      }

      // Check if max uses reached
      if (referralCode.max_uses && referralCode.current_uses >= referralCode.max_uses) {
        return { valid: false, reason: 'Code has reached maximum uses' };
      }

      // Check if client already used this code
      const usageCheck = await db.executeQuery(
        'SELECT id FROM referral_usage WHERE referral_code_id = ? AND used_by_client_id = ?',
        [referralCode.id, clientId]
      );

      if (usageCheck.length > 0) {
        return { valid: false, reason: 'Code already used by this client' };
      }

      // Check if client is trying to use their own code
      if (referralCode.owner_client_id === clientId) {
        return { valid: false, reason: 'Cannot use your own referral code' };
      }

      return {
        valid: true,
        referralCode,
        discountPercentage: referralCode.discount_percentage
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      throw error;
    }
  }

  // Use a referral code (record usage)
  static async useReferralCode(code, clientId, reservationId = null, discountAmount = 0) {
    try {
      // Get referral code details first
      const codeData = await db.executeQuery(
        'SELECT * FROM referral_codes WHERE code = ? AND is_active = TRUE',
        [code]
      );

      if (codeData.length === 0) {
        throw new Error('Referral code not found');
      }

      const referralCode = codeData[0];

      // Validate again to be sure
      const validation = await this.validateCode(code, clientId);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // Execute transaction queries
      const queries = [
        {
          query: `INSERT INTO referral_usage 
                 (referral_code_id, used_by_client_id, reservation_id, discount_amount) 
                 VALUES (?, ?, ?, ?)`,
          params: [referralCode.id, clientId, reservationId, discountAmount]
        },
        {
          query: 'UPDATE referral_codes SET current_uses = current_uses + 1 WHERE id = ?',
          params: [referralCode.id]
        }
      ];

      const results = await db.executeTransaction(queries);
      const usageResult = results[0];

      return {
        usageId: usageResult.insertId,
        discountAmount,
        referralCodeId: referralCode.id
      };
    } catch (error) {
      console.error('Error using referral code:', error);
      throw error;
    }
  }

  // Get referral codes owned by a client
  static async getClientReferralCodes(clientId) {
    try {
      const codes = await db.executeQuery(
        `SELECT rc.*, 
                COUNT(ru.id) as total_uses,
                COALESCE(SUM(ru.discount_amount), 0) as total_discounts_given
         FROM referral_codes rc 
         LEFT JOIN referral_usage ru ON rc.id = ru.referral_code_id 
         WHERE rc.owner_client_id = ? 
         GROUP BY rc.id 
         ORDER BY rc.created_at DESC`,
        [clientId]
      );

      return codes;
    } catch (error) {
      console.error('Error getting client referral codes:', error);
      throw error;
    }
  }

  // Get usage statistics for a referral code
  static async getReferralCodeStats(codeId) {
    try {
      const usage = await db.executeQuery(
        `SELECT ru.*, c.nom, c.email, r.date_reservation
         FROM referral_usage ru 
         JOIN clients c ON ru.used_by_client_id = c.id 
         LEFT JOIN reservations r ON ru.reservation_id = r.id 
         WHERE ru.referral_code_id = ? 
         ORDER BY ru.used_at DESC`,
        [codeId]
      );

      return usage;
    } catch (error) {
      console.error('Error getting referral code stats:', error);
      throw error;
    }
  }

  // Get all referral codes (admin)
  static async getAllReferralCodes(limit = 50, offset = 0) {
    try {
      const codes = await db.executeQuery(
        `SELECT rc.*, c.nom as owner_name, c.email as owner_email,
                COUNT(ru.id) as total_uses,
                COALESCE(SUM(ru.discount_amount), 0) as total_discounts_given
         FROM referral_codes rc 
         JOIN clients c ON rc.owner_client_id = c.id 
         LEFT JOIN referral_usage ru ON rc.id = ru.referral_code_id 
         GROUP BY rc.id 
         ORDER BY rc.created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const countResult = await db.executeQuery(
        'SELECT COUNT(*) as total FROM referral_codes'
      );

      return {
        codes,
        total: countResult[0].total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting all referral codes:', error);
      throw error;
    }
  }

  // Deactivate a referral code
  static async deactivateCode(codeId) {
    try {
      const result = await db.executeQuery(
        'UPDATE referral_codes SET is_active = FALSE WHERE id = ?',
        [codeId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deactivating referral code:', error);
      throw error;
    }
  }

  // Calculate discount amount based on percentage and total price
  static calculateDiscountAmount(totalPrice, discountPercentage) {
    return Math.round((totalPrice * discountPercentage / 100) * 100) / 100; // Round to 2 decimal places
  }
}

module.exports = ReferralCode;