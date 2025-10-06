/**
 * Jotform API Service
 * 
 * This service provides methods to interact with the Jotform API.
 * It handles form submissions, retrieving submission data, and other Jotform operations.
 */

const axios = require('axios');
const jotformConfig = require('../config/jotform');

class JotformService {
  constructor() {
    this.apiKey = jotformConfig.apiKey;
    this.apiUrl = jotformConfig.apiUrl;
    this.formId = jotformConfig.formId;
    this.enabled = jotformConfig.enabled;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: jotformConfig.requestTimeout,
      headers: {
        'APIKEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if Jotform integration is enabled
   */
  isEnabled() {
    return this.enabled && this.apiKey && this.formId;
  }

  /**
   * Get form details
   */
  async getForm() {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled or configured');
      }

      const response = await this.api.get(`/form/${this.formId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Jotform form:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific submission by ID
   * @param {string} submissionId - The Jotform submission ID
   */
  async getSubmission(submissionId) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled or configured');
      }

      const response = await this.api.get(`/submission/${submissionId}`);
      return response.data.content;
    } catch (error) {
      console.error('Error fetching Jotform submission:', error.message);
      throw error;
    }
  }

  /**
   * Get all submissions for the configured form
   * @param {object} filters - Optional filters (offset, limit, orderby, etc.)
   */
  async getFormSubmissions(filters = {}) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled or configured');
      }

      const params = {
        offset: filters.offset || 0,
        limit: filters.limit || 20,
        orderby: filters.orderby || 'created_at'
      };

      const response = await this.api.get(`/form/${this.formId}/submissions`, { params });
      return response.data.content;
    } catch (error) {
      console.error('Error fetching form submissions:', error.message);
      throw error;
    }
  }

  /**
   * Validate submission data structure
   * @param {object} submissionData - The submission data to validate
   */
  validateSubmission(submissionData) {
    if (!submissionData) {
      return { valid: false, error: 'Submission data is required' };
    }

    if (!submissionData.submissionID && !submissionData.id) {
      return { valid: false, error: 'Submission ID is required' };
    }

    if (!submissionData.answers && !submissionData.submission) {
      return { valid: false, error: 'Submission answers are required' };
    }

    return { valid: true };
  }

  /**
   * Format submission data for storage
   * @param {object} submissionData - Raw submission data from Jotform
   */
  formatSubmissionForStorage(submissionData) {
    return {
      submissionID: submissionData.submissionID || submissionData.id,
      formID: submissionData.form_id || this.formId,
      created_at: submissionData.created_at || new Date().toISOString(),
      updated_at: submissionData.updated_at || new Date().toISOString(),
      answers: submissionData.answers || submissionData.submission,
      ip: submissionData.ip || null,
      status: submissionData.status || 'ACTIVE'
    };
  }

  /**
   * Extract readable answers from submission data
   * @param {object} submissionData - Formatted submission data
   */
  extractReadableAnswers(submissionData) {
    if (!submissionData.answers) {
      return {};
    }

    const readable = {};
    
    Object.keys(submissionData.answers).forEach(key => {
      const answer = submissionData.answers[key];
      
      if (answer && typeof answer === 'object') {
        // Extract question text and answer
        readable[answer.text || `Question_${key}`] = answer.answer || answer.prettyFormat || '';
      }
    });

    return readable;
  }

  /**
   * Setup webhook for form (optional)
   * @param {string} webhookUrl - URL to receive webhook notifications
   */
  async setupWebhook(webhookUrl) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled or configured');
      }

      const response = await this.api.post(`/form/${this.formId}/webhooks`, {
        webhookURL: webhookUrl
      });

      return response.data;
    } catch (error) {
      console.error('Error setting up Jotform webhook:', error.message);
      throw error;
    }
  }

  /**
   * Delete a webhook
   * @param {string} webhookId - The webhook ID to delete
   */
  async deleteWebhook(webhookId) {
    try {
      if (!this.isEnabled()) {
        throw new Error('Jotform integration is not enabled or configured');
      }

      const response = await this.api.delete(`/form/${this.formId}/webhooks/${webhookId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting Jotform webhook:', error.message);
      throw error;
    }
  }
}

module.exports = new JotformService();
