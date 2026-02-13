/**
 * WordPress API Service
 * Handles all communication with WordPress REST API for paper storage
 */

// Try both possible API endpoints
const API_BASE_URL = 'https://ahsan.ronybormon.com/wp-json/qpm/v1';
const API_FALLBACK_URL = 'https://ahsan.ronybormon.com/wp-json/qpm/v1';

// Test if API is available
let apiAvailable = true;

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
  // Return error details without throwing
  return {
    success: false,
    error: error.message || 'API request failed'
  };
};

/**
 * Check if API is available
 */
const checkApiAvailability = async () => {
  try {
    console.log('[API Check] Testing endpoint:', `${API_BASE_URL}/papers`);
    const response = await fetch(`${API_BASE_URL}/papers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    apiAvailable = response.ok || response.status !== 404;
    console.log('[API Check] Status:', response.status, 'Available:', apiAvailable);
    
    if (!response.ok && response.status === 404) {
      console.error('[API Check] 404 Error - Plugin might not be activated. Check WordPress admin panel.');
    }
    
    return apiAvailable;
  } catch (error) {
    console.warn('[API Check] Network error:', error);
    apiAvailable = false;
    return false;
  }
};

/**
 * Get all papers from WordPress
 */
export const fetchAllPapers = async () => {
  try {
    console.log('[Fetch Papers] Getting all papers from:', `${API_BASE_URL}/papers`);
    
    const response = await fetch(`${API_BASE_URL}/papers`, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    console.log('[Fetch Papers] Response status:', response.status);
    
    if (!response.ok) {
      console.error('[Fetch Papers] Error status:', response.status);
      if (response.status === 404) {
        console.error('[Fetch Papers] 404 - Routes not registered, plugin may not be updated');
      }
      // Return empty array on error instead of throwing
      return [];
    }
    
    const data = await response.json();
    // Handle both direct array response and wrapped response
    const papers = Array.isArray(data) ? data : (data.papers || data || []);
    console.log('[Fetch Papers] Got', papers.length, 'papers');
    
    // Ensure all papers have required fields with safe defaults
    const validPapers = papers.map((paper: any) => ({
      id: paper.id || '',
      title: paper.title || 'Untitled',
      setup: paper.setup || { subject: '', class: '', examType: '', date: '', schoolName: '', instructions: '' },
      questions: Array.isArray(paper.questions) ? paper.questions : [],
      createdAt: paper.createdAt || new Date().toISOString(),
      updatedAt: paper.updatedAt || new Date().toISOString(),
      ...paper
    }));
    
    return validPapers;
  } catch (error) {
    console.error('[Fetch Papers] Exception:', error);
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
    console.log('[Save Paper] Starting save operation for:', title);
    console.log('[Save Paper] API URL:', `${API_BASE_URL}/papers`);
    
    // Check API availability
    const isAvailable = await checkApiAvailability();
    if (!isAvailable) {
      const errMsg = 'WordPress API not available. Plugin may not be activated on https://ahsan.ronybormon.com';
      console.error('[Save Paper]', errMsg);
      return { 
        success: false, 
        error: errMsg,
        id: null
      };
    }

    console.log('[Save Paper] API available, proceeding with save');
    const response = await fetch(`${API_BASE_URL}/papers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
        data,
        pageSettings,
      }),
    });
    
    console.log('[Save Paper] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = `HTTP error! status: ${response.status}`;
      console.error('[Save Paper] Error:', errMsg);
      console.error('[Save Paper] Error details:', errorData);
      
      if (response.status === 404) {
        console.error('[Save Paper] 404 Not Found - Plugin is not activated!');
        console.error('[Save Paper] Steps to fix:');
        console.error('[Save Paper]   1. Upload plugin to /wp-content/plugins/');
        console.error('[Save Paper]   2. Go to WordPress Admin > Plugins');
        console.error('[Save Paper]   3. Activate "Question Paper PDF Generator"');
        console.error('[Save Paper]   4. Refresh this page');
      }
      
      return { 
        success: false, 
        error: errMsg,
        id: null
      };
    }
    
    const result = await response.json();
    console.log('[Save Paper] Success! Paper ID:', result.post_id);
    
    return {
      success: true,
      id: result.post_id,
      ...result,
    };
  } catch (error) {
    const errMsg = (error as Error).message || 'Unknown error';
    console.error('[Save Paper] Exception:', errMsg);
    return { 
      success: false, 
      error: errMsg,
      id: null
    };
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
