/**
 * WordPress API Service
 * Handles all communication with WordPress REST API for paper storage
 */

const API_BASE_URL = 'https://ahsan.ronybormon.com/wp-json/qpm/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Get headers with auth token
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Handle API errors
 */
const handleError = (error: any) => {
  console.error('API Error:', error);
  throw new Error(error.message || 'API request failed');
};

/**
 * Get all papers from WordPress
 */
export const fetchAllPapers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.papers || [];
  } catch (error) {
    handleError(error);
    return [];
  }
};

/**
 * Get a single paper from WordPress
 */
export const fetchPaperById = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.paper;
  } catch (error) {
    handleError(error);
    return null;
  }
};

/**
 * Save a new paper to WordPress
 */
export const savePaperToWordPress = async (title: string, data: any, pageSettings: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        data,
        pageSettings,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      id: result.post_id,
      ...result,
    };
  } catch (error) {
    handleError(error);
    return { success: false };
  }
};

/**
 * Update a paper in WordPress
 */
export const updatePaperInWordPress = async (id: string, title: string, data: any, pageSettings: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        data,
        pageSettings,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    handleError(error);
    return { success: false };
  }
};

/**
 * Delete a paper from WordPress
 */
export const deletePaperFromWordPress = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    handleError(error);
    return { success: false };
  }
};

/**
 * Duplicate a paper in WordPress
 */
export const duplicatePaperInWordPress = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/papers/${id}/duplicate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      id: result.post_id,
      ...result,
    };
  } catch (error) {
    handleError(error);
    return { success: false };
  }
};
