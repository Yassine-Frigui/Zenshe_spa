/**
 * Jotform API Utilities
 * 
 * Frontend utility functions for interacting with Jotform
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Check if Jotform integration is enabled
 */
export const checkJotformStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/jotform/status`);
    return response.data;
  } catch (error) {
    console.error('Error checking Jotform status:', error);
    return { enabled: false, message: 'Jotform integration unavailable' };
  }
};

/**
 * Get form configuration
 */
export const getFormConfig = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/jotform/form`);
    return response.data;
  } catch (error) {
    console.error('Error fetching form config:', error);
    throw error;
  }
};

/**
 * Validate submission data before sending to backend
 */
export const validateSubmission = async (submissionData) => {
  try {
    const response = await axios.post(`${API_URL}/api/jotform/validate-submission`, {
      submissionData
    });
    return response.data;
  } catch (error) {
    console.error('Error validating submission:', error);
    throw error;
  }
};

/**
 * Get submission by ID
 */
export const getSubmission = async (submissionId) => {
  try {
    const response = await axios.get(`${API_URL}/api/jotform/submission/${submissionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
};

/**
 * Format submission data for storage
 */
export const formatSubmissionData = (rawData) => {
  // Extract relevant information from Jotform submission
  return {
    submissionID: rawData.submissionID || rawData.submission_id,
    formID: rawData.formID || rawData.form_id,
    created_at: rawData.created_at || new Date().toISOString(),
    answers: rawData.answers || rawData.submission || {},
    status: rawData.status || 'ACTIVE'
  };
};

/**
 * Extract readable answers from submission
 */
export const extractReadableAnswers = (submissionData) => {
  if (!submissionData || !submissionData.answers) {
    return {};
  }

  const readable = {};
  
  Object.keys(submissionData.answers).forEach(key => {
    const answer = submissionData.answers[key];
    
    if (answer && typeof answer === 'object') {
      const questionText = answer.text || answer.name || `Question ${key}`;
      const answerValue = answer.answer || answer.prettyFormat || answer.value || '';
      
      if (answerValue) {
        readable[questionText] = answerValue;
      }
    }
  });

  return readable;
};

/**
 * Check if submission is complete
 */
export const isSubmissionComplete = (submissionData) => {
  if (!submissionData) {
    return false;
  }

  // Check if we have a submission ID and answers
  const hasId = !!(submissionData.submissionID || submissionData.submission_id);
  const hasAnswers = !!(submissionData.answers || submissionData.submission);

  return hasId && hasAnswers;
};

export default {
  checkJotformStatus,
  getFormConfig,
  validateSubmission,
  getSubmission,
  formatSubmissionData,
  extractReadableAnswers,
  isSubmissionComplete
};
