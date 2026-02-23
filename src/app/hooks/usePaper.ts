import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { QuestionPaper } from '../types';
import { loadPapers } from '../utils/storage';

/**
 * Load paper by paperId from URL params.
 * Redirects to home if paper not found.
 */
export function usePaper() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<QuestionPaper | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!paperId) return;
      const papers = await loadPapers();
      const found = papers.find((p) => p.id === paperId);
      if (found) {
        setPaper(found);
      } else {
        navigate('/');
      }
    };
    load();
  }, [paperId, navigate]);

  return { paper, setPaper, paperId };
}
