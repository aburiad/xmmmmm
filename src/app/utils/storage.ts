import { QuestionPaper } from '../types';
import * as wpApi from './wpApiService';

const STORAGE_KEY = 'bd-board-question-papers';
const USE_WORDPRESS = true; // Toggle to use WordPress storage

/**
 * Save papers to WordPress (primary) and fallback to localStorage
 */
export const savePapers = async (papers: QuestionPaper[]) => {
  try {
    // Always keep localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    
    // If WordPress storage is enabled, sync there too
    if (USE_WORDPRESS) {
      for (const paper of papers) {
        if (paper.id && !paper.id.startsWith('temp-')) {
          // If paper has a numeric ID, it's from WordPress
          if (/^\d+$/.test(paper.id)) {
            await wpApi.updatePaperInWordPress(
              paper.id,
              paper.setup?.schoolName || 'Untitled Paper',
              paper,
              { /* pageSettings if available */ }
            );
          } else {
            // New paper - save to WordPress
            const result = await wpApi.savePaperToWordPress(
              paper.setup?.schoolName || 'Untitled Paper',
              paper,
              { /* pageSettings if available */ }
            );
            if (result.success && result.id) {
              paper.id = result.id.toString();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error saving papers:', error);
    // Fallback to localStorage only
    localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
  }
};

/**
 * Load papers from localStorage (with WordPress sync in background)
 */
export const loadPapers = (): QuestionPaper[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const papers = data ? JSON.parse(data) : [];
    
    // Debug: Log table blocks when loading
    papers.forEach((paper: QuestionPaper, pidx: number) => {
      paper.questions.forEach((q, qidx) => {
        q.blocks.forEach((b, bidx) => {
          if (b.type === 'table') {
            console.log(`📥 Loaded Table from Paper${pidx + 1} Q${qidx + 1} Block${bidx + 1}:`, {
              rows: b.content.rows,
              cols: b.content.cols,
              headers: b.content.headers,
              data: b.content.data
            });
          }
        });
      });
    });
    
    // Background: Sync with WordPress if enabled
    if (USE_WORDPRESS) {
      syncWithWordPress().catch(err => console.error('Background sync error:', err));
    }
    
    return papers;
  } catch (error) {
    console.error('Error loading papers:', error);
    return [];
  }
};

/**
 * Save a single paper
 */
export const savePaper = async (paper: QuestionPaper) => {
  try {
    const papers = loadPapers();
    const index = papers.findIndex(p => p.id === paper.id);
    
    // Debug: Log table blocks before saving
    paper.questions.forEach((q, idx) => {
      q.blocks.forEach((b, bidx) => {
        if (b.type === 'table') {
          console.log(`📊 Saving Table in Q${idx + 1} Block${bidx + 1}:`, {
            rows: b.content.rows,
            cols: b.content.cols,
            headers: b.content.headers,
            data: b.content.data
          });
        }
      });
    });
    
    if (index >= 0) {
      papers[index] = paper;
    } else {
      papers.push(paper);
    }
    
    // Save locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    
    // Save to WordPress if enabled
    if (USE_WORDPRESS) {
      if (paper.id && /^\d+$/.test(paper.id)) {
        // Update existing paper
        await wpApi.updatePaperInWordPress(
          paper.id,
          paper.setup?.schoolName || 'Untitled Paper',
          paper,
          { /* pageSettings */ }
        );
      } else {
        // Create new paper
        const result = await wpApi.savePaperToWordPress(
          paper.setup?.schoolName || 'Untitled Paper',
          paper,
          { /* pageSettings */ }
        );
        
        if (result.success && result.id) {
          // Update the paper ID to WordPress ID
          paper.id = result.id.toString();
          papers[index >= 0 ? index : papers.length - 1] = paper;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
        }
      }
    }
  } catch (error) {
    console.error('Error saving paper:', error);
  }
};

/**
 * Delete a paper
 */
export const deletePaper = async (id: string) => {
  try {
    const papers = loadPapers();
    const filtered = papers.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // Delete from WordPress if it's a WordPress paper
    if (USE_WORDPRESS && /^\d+$/.test(id)) {
      await wpApi.deletePaperFromWordPress(id);
    }
  } catch (error) {
    console.error('Error deleting paper:', error);
  }
};

/**
 * Duplicate a paper
 */
export const duplicatePaper = async (id: string): Promise<QuestionPaper | null> => {
  try {
    const papers = loadPapers();
    const paper = papers.find(p => p.id === id);
    
    if (!paper) return null;
    
    const newPaper: QuestionPaper = {
      ...paper,
      id: generateId(),
      setup: {
        ...paper.setup,
        schoolName: paper.setup.schoolName ? `${paper.setup.schoolName} (Copy)` : undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Save duplicate locally
    papers.push(newPaper);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    
    // Duplicate in WordPress if enabled and original is a WordPress paper
    if (USE_WORDPRESS && /^\d+$/.test(id)) {
      const result = await wpApi.duplicatePaperInWordPress(id);
      if (result.success && result.id) {
        newPaper.id = result.id.toString();
        papers[papers.length - 1] = newPaper;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
      }
    }
    
    return newPaper;
  } catch (error) {
    console.error('Error duplicating paper:', error);
    return null;
  }
};

/**
 * Generate unique ID for new papers
 */
export const generateId = () => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all papers
 */
export const getAllPapers = (): QuestionPaper[] => {
  return loadPapers();
};

/**
 * Clear all papers from localStorage
 */
export const clearAllPapers = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Background sync with WordPress
 */
const syncWithWordPress = async () => {
  if (!USE_WORDPRESS) return;
  
  try {
    // Fetch papers from WordPress
    const wpPapers = await wpApi.fetchAllPapers();
    
    // Merge with local papers (local takes precedence)
    const localPapers = loadPapers();
    const merged: QuestionPaper[] = [...localPapers];
    
    // Add WordPress papers that don't exist locally
    for (const wpPaper of wpPapers) {
      if (!merged.find(p => p.id === wpPaper.id)) {
        merged.push(wpPaper);
      }
    }
    
    // Update localStorage with merged data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Background sync error:', error);
  }
};