import { useEffect, useRef, useState } from 'react';

interface PaginatedPagePreviewProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  includeHeader?: boolean;
  showToolbar?: boolean;
}

const MM_TO_PX = 96 / 25.4;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PAGE_PAD_MM = 18;

export function PaginatedPagePreview({
  children,
  header,
  footer,
  includeHeader = true,
  showToolbar = true,
}: PaginatedPagePreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Force scale = 1 (no scaling)
      setScale(1);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const performPagination = () => {
      const pageWidthPx = PAGE_W_MM * MM_TO_PX;
      const pageHeightPx = PAGE_H_MM * MM_TO_PX;
      const padPx = PAGE_PAD_MM * MM_TO_PX;

      // available content height inside page
      const maxContentHeightPx = pageHeightPx - padPx * 2 - 40;

      // ensure source content rendered at A4 width for accurate measurement
      contentRef.current.style.width = `${PAGE_W_MM}mm`;

      // clear previous pages
      containerRef.current.innerHTML = '';

      const createPageElement = (withHeader: boolean) => {
        const section = document.createElement('section');
        section.className = 'page';
        section.style.width = `${PAGE_W_MM}mm`;
        section.style.minHeight = `${PAGE_H_MM}mm`;
        section.style.height = `${PAGE_H_MM}mm`;
        section.style.padding = `${PAGE_PAD_MM}mm`;
        section.style.boxSizing = 'border-box';
        section.style.overflow = 'hidden';
        section.style.breakAfter = 'page';

        const inner = document.createElement('div');
        inner.className = 'page-inner';

        if (withHeader && header) {
          const headerClone = contentRef.current?.querySelector('[data-page-header]');
          if (headerClone) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'page-header';
            headerDiv.innerHTML = (headerClone as HTMLElement).innerHTML;
            inner.appendChild(headerDiv);
          }
        }

        const content = document.createElement('div');
        content.className = 'page-content';
        inner.appendChild(content);
        section.appendChild(inner);
        return { section, content };
      };

      const questions = Array.from(contentRef.current.querySelectorAll('.question')) as HTMLElement[];
      if (questions.length === 0) return;

      // Use an off-screen measuring container (inside contentRef) to decide pagination
      const meas = document.createElement('div');
      meas.style.width = `${PAGE_W_MM}mm`;
      meas.style.position = 'absolute';
      meas.style.left = '-99999px';
      meas.style.top = '0';
      meas.style.visibility = 'hidden';
      contentRef.current.appendChild(meas);

      const headerClone = contentRef.current.querySelector('[data-page-header]') as HTMLElement | null;

      let pageIndex = 0;
      let currentPage = createPageElement(includeHeader);
      containerRef.current.appendChild(currentPage.section);

      // Prepare measuring content for the first page (include header if needed)
      const prepareMeasForPage = (withHeader: boolean) => {
        meas.innerHTML = '';
        if (withHeader && headerClone) {
          const tmp = document.createElement('div');
          tmp.className = 'page-header';
          tmp.innerHTML = headerClone.innerHTML;
          meas.appendChild(tmp);
        }
      };

      prepareMeasForPage(includeHeader);

      for (let i = 0; i < questions.length; i++) {
        const qClone = questions[i].cloneNode(true) as HTMLElement;
        meas.appendChild(qClone);

        // If adding this question exceeds available height, start a new page
        if (meas.scrollHeight > maxContentHeightPx) {
          // remove question from meas
          meas.removeChild(qClone);

          // start new page (no header)
          currentPage = createPageElement(false);
          containerRef.current.appendChild(currentPage.section);
          pageIndex++;

          // reset meas for new page and append this question to meas then to page
          prepareMeasForPage(false);
          meas.appendChild(qClone);
          currentPage.content.appendChild(qClone.cloneNode(true));
        } else {
          // fits current page
          currentPage.content.appendChild(qClone.cloneNode(true));
        }
      }

      // clean up measuring element
      contentRef.current.removeChild(meas);

      // enforce no-scaling: wrapper stays at full A4 size
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `scale(1)`;
        wrapperRef.current.style.transformOrigin = 'top left';
        wrapperRef.current.style.width = `${PAGE_W_MM}mm`;
      }
    };

    // small delay to ensure content ready
    const id = window.requestAnimationFrame(performPagination);
    return () => window.cancelAnimationFrame(id);
  }, [children, header, includeHeader, scale]);

  return (
    <div className="paginated-container">
      {showToolbar && (
        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>
            PDF ডাউনলোড করুন
          </button>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#444' }}>
            প্রিন্ট ডায়ালগে <b>Destination: Save as PDF</b>, <b>Paper: A4</b>, <b>Scale: 100%</b> রাখো
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: `${PAGE_W_MM}mm`,
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -1,
        }}
        data-pagination-source="true"
      >
        {header && <div data-page-header>{header}</div>}
        {children}
      </div>

      {/* Wrapper holds pages and gets scaled on small screens */}
      {/* Mobile: show full A4 width and allow horizontal scrolling (desktop-like) */}
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <div
          ref={wrapperRef}
          style={{
            transform: `scale(1)`,
            transformOrigin: 'top left',
            width: `${PAGE_W_MM}mm`,
          }}
        >
          <div ref={containerRef} className="pages-container" />
        </div>
      </div>

      {footer && (
        <div className="pages-footer no-print">
          {footer}
        </div>
      )}
    </div>
  );
}
