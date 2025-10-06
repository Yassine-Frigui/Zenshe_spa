/**
 * Jotform Routes
 * 
 * Handles Jotform-related operations including:
 * - Retrieving form details
 * - Fetching submission data
 * - Validating submissions before reservation
 */

const express = require('express');
const router = express.Router();
const jotformService = require('../services/JotFormService');

/**
 * GET /api/jotform/status
 * Check if Jotform integration is enabled
 */
router.get('/status', (req, res) => {
  try {
    const isEnabled = jotformService.isEnabled();
    res.json({
      enabled: isEnabled,
      message: isEnabled 
        ? 'Jotform integration is active' 
        : 'Jotform integration is not configured'
    });
  } catch (error) {
    console.error('Error checking Jotform status:', error);
    res.status(500).json({
      message: 'Error checking Jotform status',
      error: error.message
    });
  }
});

/**
 * GET /api/jotform/form
 * Get the configured form details
 */
router.get('/form', async (req, res) => {
  try {
    const form = await jotformService.getForm();
    res.json({
      success: true,
      form
    });
  } catch (error) {
    console.error('Error fetching Jotform form:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching form details',
      error: error.message
    });
  }
});

/**
 * GET /api/jotform/submission/:id
 * Get a specific submission by ID
 */
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await jotformService.getSubmission(id);
    
    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Error fetching Jotform submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
});

/**
 * POST /api/jotform/validate-submission
 * Validate a submission before creating a reservation
 */
router.post('/validate-submission', async (req, res) => {
  try {
    const { submissionData } = req.body;
    
    if (!submissionData) {
      return res.status(400).json({
        success: false,
        message: 'Submission data is required'
      });
    }

    // Validate the submission structure
    const validation = jotformService.validateSubmission(submissionData);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Format the submission for storage
    const formatted = jotformService.formatSubmissionForStorage(submissionData);
    const readable = jotformService.extractReadableAnswers(formatted);

    res.json({
      success: true,
      message: 'Submission is valid',
      formatted,
      readable
    });
  } catch (error) {
    console.error('Error validating Jotform submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating submission',
      error: error.message
    });
  }
});

/**
 * POST /api/jotform/webhook
 * Webhook endpoint to receive Jotform submissions (optional)
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('Received Jotform webhook:', req.body);
    
    // You can process the webhook data here
    // For example, update a reservation status, send notifications, etc.
    
    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  } catch (error) {
    console.error('Error processing Jotform webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

module.exports = router;
