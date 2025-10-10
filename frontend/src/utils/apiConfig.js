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
  
  // If imagePath already starts with http, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If path starts with /images/ it's in the frontend public folder
  if (imagePath.startsWith('/images/')) {
    return imagePath; // Vite will serve from public folder
  }
  
  // If path starts with /uploads/ it's on the backend
  if (imagePath.startsWith('/uploads/')) {
    const baseUrl = getApiUrl();
    return `${baseUrl}${imagePath}`;
  }
  
  // Ensure imagePath starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Default: check if it's an upload or public image
  if (path.includes('/uploads/')) {
    const baseUrl = getApiUrl();
    return `${baseUrl}${path}`;
  }
  
  // Otherwise treat as frontend public file
  return path;
};

export default {
  getApiUrl,
  getImageUrl
};
