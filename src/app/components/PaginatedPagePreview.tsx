import { useEffect, useRef, useState } from 'react';

interface PaginatedPagePreviewProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  includeHeader?: boolean;
  showToolbar?: boolean;
}

/**
 * Component that automatically paginates content across A4 pages.
 * Content is dynamically distributed across pages as they fill up.
 * 
 * Usage:
 * <PaginatedPagePreview header={<div>Header Content</div>}>
 *   <div className="question">Question 1</div>
 *   <div className="question">Question 2</div>
 * </PaginatedPagePreview>
 */
export function PaginatedPagePreview({
  children,
  header,
  footer,
  includeHeader = true,
  showToolbar = true,
}: PaginatedPagePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const performPagination = () => {
      if (!containerRef.current || !contentRef.current) return;

      // Adapt measurements based on screen size
      let contentWidth: string;
      let maxContentHeightPx: number;
      
      if (isMobile) {
        // Mobile: single column, responsive width
        contentWidth = '100%';
        // Mobile page height is shorter for readability
        const pageHeightPx = 800; // Smaller pages for mobile scrolling
        const paddingPx = 16; // Smaller padding on mobile
        maxContentHeightPx = pageHeightPx - paddingPx * 2 - 30; // 724px available
      } else {
        // Desktop: A4 standard
        contentWidth = '210mm';
        const pageHeightPx = 1123; // 297mm @ 96 DPI
        const paddingPx = 68; // 18mm @ 96 DPI
        maxContentHeightPx = pageHeightPx - paddingPx * 2 - 40; // 947px available
      }

      // Update content div width for proper measurement
      if (contentRef.current) {
        contentRef.current.style.width = contentWidth;
      }

      // Clear previous pages
      containerRef.current.innerHTML = '';

      // Create page template
      const createPageElement = (hasHeader: boolean) => {
        const section = document.createElement('section');
        section.className = 'page';

        const inner = document.createElement('div');
        inner.className = 'page-inner';

        if (hasHeader && header) {
          const headerDiv = document.createElement('div');
          headerDiv.className = 'page-header';
          const headerClone = contentRef.current?.querySelector(
            '[data-page-header]'
          );
          if (headerClone) {
            headerDiv.innerHTML = headerClone.innerHTML;
          }
          inner.appendChild(headerDiv);
        }

        const content = document.createElement('div');
        content.className = 'page-content';
        inner.appendChild(content);
        section.appendChild(inner);

        return { section, content };
      };

      // Get all question elements
      const questions = Array.from(
        contentRef.current.querySelectorAll('.question')
      ) as HTMLElement[];

      if (questions.length === 0) {
        return;
      }

      // Distribute questions across pages
      let currentPageEl = createPageElement(includeHeader);
      containerRef.current.appendChild(currentPageEl.section);
      let currentContent = currentPageEl.content;

      for (let i = 0; i < questions.length; i++) {
        const qEl = questions[i].cloneNode(true) as HTMLElement;
        currentContent.appendChild(qEl);

        // Keep checking and moving content if it overflows
        while (
          currentContent.scrollHeight > maxContentHeightPx &&
          currentContent.children.length > 1
        ) {
          const last = currentContent.lastElementChild;
          if (!last) break;

          last.remove();

          // Create new page without header
          const newPageEl = createPageElement(false);
          containerRef.current?.appendChild(newPageEl.section);

          const clonedLast = last.cloneNode(true) as HTMLElement;
          newPageEl.content.appendChild(clonedLast);
          currentContent = newPageEl.content;
        }
      }
    };

    // Use a small delay to ensure content is fully rendered
    const timeoutId = setTimeout(performPagination, 100);
    return () => clearTimeout(timeoutId);
  }, [children, header, includeHeader, isMobile]);

  return (
    <div className="paginated-container">
      {showToolbar && (
        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>
            PDF ডাউনলোড করুন
          </button>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#444' }}>
            প্রিন্ট ডায়ালগে <b>Destination: Save as PDF</b>, <b>Paper: A4</b>,{' '}
            <b>Scale: 100%</b> রাখো
          </div>
        </div>
      )}

      {/* Hidden content source - used for extracting and distributing questions */}
      <div
        ref={contentRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: isMobile ? '95vw' : '210mm',
          maxWidth: '100%',
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -1,
        }}
        data-pagination-source="true"
      >
        {header && <div data-page-header>{header}</div>}
        {children}
      </div>

      {/* Pages container - rendered by pagination logic */}
      <div ref={containerRef} className="pages-container" />

      {/* Footer section - stays at bottom, no overlap */}
      {footer && (
        <div className="pages-footer no-print">
          {footer}
        </div>
      )}
    </div>
  );
}
