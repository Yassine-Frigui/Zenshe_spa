const express = require('express');
const router = express.Router();
const ReferralCode = require('../models/ReferralCode');
const { authenticateClient } = require('../middleware/auth');
const db = require('../../config/database');

// Create a new referral code for authenticated client
router.post('/generate', authenticateClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { discountPercentage = 10, maxUses = null, expiresAt = null } = req.body;

    // Validate discount percentage
    if (discountPercentage < 1 || discountPercentage > 50) {
      return res.status(400).json({
        error: 'Discount percentage must be between 1% and 50%'
      });
    }

    const referralCode = await ReferralCode.createReferralCode(
      clientId,
      discountPercentage,
      maxUses,
      expiresAt
    );

    res.status(201).json({
      success: true,
      referralCode,
      message: 'Referral code generated successfully'
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({
      error: 'Failed to generate referral code',
      details: error.message
    });
  }
});

// Validate a referral code for signup (no authentication needed)
router.post('/validate-for-signup', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Referral code is required'
      });
    }

    // Get the specific referral code
    const [codeData] = await db.executeQuery(
      'SELECT * FROM referral_codes WHERE code = ? AND is_active = TRUE',
      [code]
    );

    if (codeData.length === 0) {
      return res.status(400).json({
        valid: false,
        reason: 'Code not found or inactive'
      });
    }

    const referralCode = codeData[0];

    if (!referralCode) {
      return res.status(400).json({
        valid: false,
        reason: 'Code not found or inactive'
      });
    }

    // Check if code has expired
    if (referralCode.expires_at && new Date() > new Date(referralCode.expires_at)) {
      return res.status(400).json({
        valid: false,
        reason: 'Code has expired'
      });
    }

    // Check if max uses reached
    if (referralCode.max_uses && referralCode.current_uses >= referralCode.max_uses) {
      return res.status(400).json({
        valid: false,
        reason: 'Code has reached maximum uses'
      });
    }

    res.json({
      valid: true,
      discountPercentage: referralCode.discount_percentage,
      message: `Valid referral code! ${referralCode.discount_percentage}% discount available.`
    });
  } catch (error) {
    console.error('Error validating referral code for signup:', error);
    res.status(500).json({
      error: 'Failed to validate referral code',
      details: error.message
    });
  }
});

// Validate a referral code
router.post('/validate', authenticateClient, async (req, res) => {
  try {
    const { code } = req.body;
    const clientId = req.user.id;

    if (!code) {
      return res.status(400).json({
        error: 'Referral code is required'
      });
    }

    const validation = await ReferralCode.validateCode(code, clientId);

    if (validation.valid) {
      res.json({
        valid: true,
        discountPercentage: validation.discountPercentage,
        message: `Valid referral code! ${validation.discountPercentage}% discount applied.`
      });
    } else {
      res.status(400).json({
        valid: false,
        reason: validation.reason
      });
    }
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      error: 'Failed to validate referral code',
      details: error.message
    });
  }
});

// Use a referral code (called during booking)
router.post('/use', authenticateClient, async (req, res) => {
  try {
    const { code, reservationId, totalPrice } = req.body;
    const clientId = req.user.id;

    if (!code || !totalPrice) {
      return res.status(400).json({
        error: 'Referral code and total price are required'
      });
    }

    // Validate first
    const validation = await ReferralCode.validateCode(code, clientId);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.reason
      });
    }

    // Calculate discount amount
    const discountAmount = ReferralCode.calculateDiscountAmount(
      totalPrice,
      validation.discountPercentage
    );

    // Use the code
    const usage = await ReferralCode.useReferralCode(
      code,
      clientId,
      reservationId,
      discountAmount
    );

    res.json({
      success: true,
      discountAmount,
      finalPrice: totalPrice - discountAmount,
      usage,
      message: `Referral code applied! You saved $${discountAmount}`
    });
  } catch (error) {
    console.error('Error using referral code:', error);
    res.status(500).json({
      error: 'Failed to use referral code',
      details: error.message
    });
  }
});

// Get client's referral codes
router.get('/my-codes', authenticateClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const codes = await ReferralCode.getClientReferralCodes(clientId);

    res.json({
      success: true,
      referralCodes: codes
    });
  } catch (error) {
    console.error('Error getting client referral codes:', error);
    res.status(500).json({
      error: 'Failed to get referral codes',
      details: error.message
    });
  }
});

// Get usage statistics for a specific referral code
router.get('/stats/:codeId', authenticateClient, async (req, res) => {
  try {
    const { codeId } = req.params;
    const clientId = req.user.id;

    // Verify the code belongs to the authenticated client
    const [codes] = await ReferralCode.getClientReferralCodes(clientId);
    const ownedCode = codes.find(code => code.id == codeId);

    if (!ownedCode) {
      return res.status(403).json({
        error: 'Access denied. This referral code does not belong to you.'
      });
    }

    const stats = await ReferralCode.getReferralCodeStats(codeId);

    res.json({
      success: true,
      referralCode: ownedCode,
      usage: stats
    });
  } catch (error) {
    console.error('Error getting referral code stats:', error);
    res.status(500).json({
      error: 'Failed to get referral code statistics',
      details: error.message
    });
  }
});

module.exports = router;