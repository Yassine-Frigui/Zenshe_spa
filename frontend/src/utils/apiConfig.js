/**
 * API Configuration Utilities
 * 
 * Centralized configuration for API endpoints and URLs
 */

// Get the base API URL from environment variables
export const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.warn('⚠️ VITE_API_URL not set in environment variables, using empty string (proxy mode)');
    return '';
  }
  return apiUrl;
};

// Get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder.jpg';
  
  const baseUrl = getApiUrl();
  
  // If imagePath already starts with http, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Ensure imagePath starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

export default {
  getApiUrl,
  getImageUrl
};
