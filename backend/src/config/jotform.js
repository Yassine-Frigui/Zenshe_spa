/**
 * Jotform Configuration
 * 
 * This file contains configuration for Jotform API integration.
 * Make sure to add your Jotform API key to the .env file.
 * 
 * Get your API key from: https://www.jotform.com/myaccount/api
 */

module.exports = {
  // Jotform API settings
  apiKey: process.env.JOTFORM_API_KEY || '',
  apiUrl: process.env.JOTFORM_API_URL || 'https://api.jotform.com',
  
  // Form ID for the booking form
  // You'll need to provide this after creating your form
  formId: process.env.JOTFORM_FORM_ID || '',
  
  // Webhook URL for receiving submissions (optional)
  webhookUrl: process.env.JOTFORM_WEBHOOK_URL || '',
  
  // API rate limits (based on your plan)
  rateLimits: {
    starter: 1000,
    bronze: 10000,
    silver: 50000,
    gold: 100000
  },
  
  // Request timeout in milliseconds
  requestTimeout: 30000,
  
  // Enable/disable Jotform integration
  enabled: process.env.JOTFORM_ENABLED === 'true' || false
};
