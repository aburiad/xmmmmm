import { ArrowLeft, BookOpen, Settings } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BoardStyleLayout } from '../components/BoardStyleLayout';
import { PDFDownloadButton } from '../components/PDFDownloadButton';
import { QuestionRenderer } from '../components/QuestionRenderer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '../components/ui/sheet';
import { Slider } from '../components/ui/slider';
import { ensureFontsLoaded } from '../utils/fontLoader';
import { usePaper } from '../hooks/usePaper';
import { getExamTypeBangla } from '../utils/helpers';

/** ~96dpi: 1mm = 96/25.4 px */
const MM_TO_PX = 96 / 25.4;

export default function A4Preview() {
  const { paper, paperId } = usePaper();
  const navigate = useNavigate();
  const [useBoardStyle, setUseBoardStyle] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [pageWidth, setPageWidth] = useState(210);
  const [pageHeight, setPageHeight] = useState(297);
  const [pageMargin, setPageMargin] = useState(20);
  const [baseFontSize, setBaseFontSize] = useState(16);

  /** A4 pagination: when content fills one page, next goes to new page. pageSplits[i] = question indices for page i */
  const [pageSplits, setPageSplits] = useState<number[][] | null>(null);
  const measuringRef = useRef<HTMLDivElement>(null);

  /** On mobile: scale preview to fit viewport width; on desktop use 1 */
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const pageWidthPx = pageWidth * MM_TO_PX;
      const viewW = typeof window !== 'undefined' ? window.innerWidth : 800;
      setScale(Math.min(1, viewW / pageWidthPx));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [pageWidth]);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await ensureFontsLoaded();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Font loading error:', error);
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    if (paperId) {
      const savedSettings = localStorage.getItem(`pageSettings_${paperId}`);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setPageWidth(Math.max(150, Math.min(250, settings.pageWidth ?? 210)));
          setPageHeight(Math.max(200, Math.min(400, settings.pageHeight ?? 297)));
          setPageMargin(Math.max(0, Math.min(40, settings.pageMargin ?? 20)));
          setBaseFontSize(Math.max(10, Math.min(24, settings.baseFontSize ?? 16)));
          setUseBoardStyle(settings.useBoardStyle ?? true);
        } catch (e) {
          console.error('Error loading page settings:', e);
        }
      }
    }
  }, [paperId]);

  useEffect(() => {
    if (paperId && paper) {
      const settings = {
        pageWidth,
        pageHeight,
        pageMargin,
        baseFontSize,
        useBoardStyle,
      };
      localStorage.setItem(`pageSettings_${paperId}`, JSON.stringify(settings));
    }
  }, [paperId, paper, pageWidth, pageHeight, pageMargin, baseFontSize, useBoardStyle]);

  /** Re-compute page splits when content or dimensions change */
  useEffect(() => {
    setPageSplits(null);
  }, [paper?.questions?.length, paper?.id, pageHeight, pageMargin, baseFontSize, useBoardStyle]);

  /** Measure content and split into A4 pages */
  useLayoutEffect(() => {
    if (!paper?.questions?.length || !measuringRef.current) {
      if (!paper?.questions?.length) setPageSplits(null);
      return;
    }
    const container = measuringRef.current;
    const contentHeightMm = pageHeight - pageMargin * 2;
    const contentHeightPx = contentHeightMm * MM_TO_PX;
    const firstPageContentPx = contentHeightPx;

    const nodes = container.querySelectorAll('[data-question-id]');
    if (nodes.length === 0) {
      setPageSplits([paper.questions.map((_, i) => i)]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const items: { id: string; top: number; height: number; index: number }[] = [];
    nodes.forEach((el) => {
      const id = el.getAttribute('data-question-id');
      if (!id) return;
      const rect = el.getBoundingClientRect();
      const index = paper.questions.findIndex((q) => q.id === id);
      if (index >= 0) {
        items.push({
          id,
          top: rect.top - containerRect.top,
          height: rect.height,
          index,
        });
      }
    });
    items.sort((a, b) => a.top - b.top);

    const pages: number[][] = [];
    let currentPage: number[] = [];
    let pageStartTop = 0;
    let contentBottom = 0;
    const maxFirst = firstPageContentPx;
    const maxRest = contentHeightPx;

    items.forEach((item) => {
      const maxH = pages.length === 0 ? maxFirst : maxRest;
      const newBottom = Math.max(contentBottom, item.top + item.height);
      if (newBottom - pageStartTop > maxH && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        pageStartTop = item.top;
        contentBottom = item.top + item.height;
      } else {
        contentBottom = newBottom;
      }
      currentPage.push(item.index);
    });
    if (currentPage.length > 0) pages.push(currentPage);

    setPageSplits(pages.length > 0 ? pages : [paper.questions.map((_, i) => i)]);
  }, [paper, pageHeight, pageMargin, useBoardStyle, fontsLoaded]);

  if (!paper || !fontsLoaded) return null;

  const pageStyle = {
    width: `${pageWidth}mm`,
    minHeight: `${pageHeight}mm`,
    height: `${pageHeight}mm`,
    padding: `${pageMargin}mm`,
    fontSize: `${baseFontSize}px`,
    boxSizing: 'border-box' as const,
    overflow: 'hidden' as const,
    pageBreakAfter: 'always' as const,
  };

  const renderPageContent = (questionIndices: number[], showHeader: boolean) => {
    const questions = questionIndices.map((i) => paper!.questions[i]).filter(Boolean);
    const paperSlice = { ...paper!, questions };
    if (useBoardStyle) {
      return <BoardStyleLayout paper={paperSlice} baseFontSize={baseFontSize} hideHeader={!showHeader} />;
    }
    return (
      <>
        {showHeader && (
          <>
            <div className="text-center mb-3 pb-3 border-b-2 border-slate-800 font-['Noto_Sans_Bengali']" data-measure="header">
              {paper!.setup.schoolName && <h1 className="text-lg font-bold mb-1">{paper!.setup.schoolName}</h1>}
              <h2 className="text-base font-semibold mb-1">{getExamTypeBangla(paper!.setup.examType)}</h2>
              <div className="flex justify-center gap-4 text-xs"><span>শ্রেণি: {paper!.setup.class}</span><span>বিষয়: {paper!.setup.subject}</span></div>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-300 mb-2 font-['Noto_Sans_Bengali']">
              <span>সময়: {paper!.setup.timeMinutes || '0'} মিনিট</span>
              <span>পূর্ণমান: {paper!.setup.totalMarks || '0'}</span>
            </div>
          </>
        )}
        <div className="font-['Noto_Sans_Bengali']">
          {questions.map((q) => (
            <div key={q.id} className="pb-2 mb-2 border-b border-slate-200 last:border-b-0">
              <QuestionRenderer question={q} />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/builder/${paperId}`)} className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 sm:p-2 rounded-lg shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">প্রিভিউ</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">A4 Format Preview</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">পেজ সেটিংস</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>পেজ সেটিংস</SheetTitle>
                    <SheetDescription>
                      পেজের আকার, মার্জিন এবং ফন্ট সাইজ কাস্টমাইজ করুন।
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="space-y-6 mt-6">
                      <div className="space-y-3">
                        <Label>পেজ প্রস্থ (Width): {pageWidth}mm</Label>
                        <Slider value={[pageWidth]} onValueChange={(v) => setPageWidth(v[0])} min={150} max={250} step={1} />
                        <Input type="number" value={pageWidth} onChange={(e) => setPageWidth(Number(e.target.value))} min={150} max={250} />
                      </div>
                      <div className="space-y-3">
                        <Label>পেজ উচ্চতা (Height): {pageHeight}mm</Label>
                        <Slider value={[pageHeight]} onValueChange={(v) => setPageHeight(v[0])} min={200} max={400} step={1} />
                        <Input type="number" value={pageHeight} onChange={(e) => setPageHeight(Number(e.target.value))} min={200} max={400} />
                      </div>
                      <div className="space-y-3">
                        <Label>মার্জিন (Margin): {pageMargin}mm</Label>
                        <Slider value={[pageMargin]} onValueChange={(v) => setPageMargin(v[0])} min={0} max={40} step={1} />
                        <Input 
                          type="number" 
                          value={pageMargin} 
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(40, Number(e.target.value)));
                            setPageMargin(val);
                          }} 
                          min={0} 
                          max={40} 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>ফন্ট সাইজ: {baseFontSize}px</Label>
                        <Slider value={[baseFontSize]} onValueChange={(v) => setBaseFontSize(v[0])} min={10} max={24} step={1} />
                        <Input type="number" value={baseFontSize} onChange={(e) => setBaseFontSize(Number(e.target.value))} min={10} max={24} />
                      </div>
                      <div className="space-y-2 pt-4 border-t">
                        <Label>প্রিসেট</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setPageWidth(210); setPageHeight(297); setPageMargin(20); setBaseFontSize(16); }}>A4</Button>
                          <Button variant="outline" size="sm" onClick={() => { setPageWidth(215); setPageHeight(279); setPageMargin(25); setBaseFontSize(16); }}>Letter</Button>
                          <Button variant="outline" size="sm" onClick={() => { setPageWidth(210); setPageHeight(297); setPageMargin(10); setBaseFontSize(14); }}>কম মার্জিন</Button>
                          <Button variant="outline" size="sm" onClick={() => { setPageWidth(210); setPageHeight(297); setPageMargin(0); setBaseFontSize(16); }}>কোন মার্জিন</Button>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <PDFDownloadButton previewRef={previewRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto overflow-x-auto overflow-y-auto p-4 sm:p-6">
        {/* Mobile: scale to fit width; desktop: no scale. Wrapper size = scaled so layout is correct. */}
        <div
          className="mx-auto bg-white shadow-sm relative"
          style={{
            width: scale < 1 ? `${pageWidth * scale}mm` : `${pageWidth}mm`,
            minHeight: scale < 1 && pageSplits?.length
              ? `${pageSplits.length * pageHeight * scale}mm`
              : scale < 1
                ? `${pageHeight * scale}mm`
                : `${pageHeight}mm`,
            position: scale < 1 ? 'relative' : undefined,
          }}
        >
          {/* Hidden measuring div: same content, used to compute page splits */}
          {paper.questions.length > 0 && (
            <div
              ref={measuringRef}
              aria-hidden
              className="bg-white"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${pageWidth}mm`,
                padding: `${pageMargin}mm`,
                fontSize: `${baseFontSize}px`,
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: -1,
              }}
            >
              {useBoardStyle ? (
                <BoardStyleLayout paper={paper} baseFontSize={baseFontSize} />
              ) : (
                <>
                  <div className="text-center mb-3 pb-3 border-b-2 border-slate-800 font-['Noto_Sans_Bengali']" data-measure="header">
                    {paper.setup.schoolName && <h1 className="text-lg font-bold mb-1">{paper.setup.schoolName}</h1>}
                    <h2 className="text-base font-semibold mb-1">{getExamTypeBangla(paper.setup.examType)}</h2>
                    <div className="flex justify-center gap-4 text-xs"><span>শ্রেণি: {paper.setup.class}</span><span>বিষয়: {paper.setup.subject}</span></div>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-300 mb-2 font-['Noto_Sans_Bengali']">
                    <span>সময়: {paper.setup.timeMinutes || '0'} মিনিট</span>
                    <span>পূর্ণমান: {paper.setup.totalMarks || '0'}</span>
                  </div>
                  <div className="font-['Noto_Sans_Bengali']">
                    {paper.questions.map((q) => (
                      <div key={q.id} className="pb-2 mb-2 border-b border-slate-200 last:border-b-0" data-question-id={q.id}>
                        <QuestionRenderer question={q} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Visible / printable: one or multiple A4 pages */}
          <div
            ref={previewRef}
            id="printable-content"
            className="bg-white"
            style={{
              margin: scale < 1 ? 0 : '0 auto',
              ...(scale < 1 ? { position: 'absolute' as const, top: 0, left: 0, transform: `scale(1)`, transformOrigin: 'left top' } : {}),
            }}
          >
            {pageSplits && pageSplits.length > 0 ? (
              <>
                {pageSplits.map((indices, pageIndex) => (
                  <section
                    key={pageIndex}
                    className="print-page bg-white"
                    style={{
                      ...pageStyle,
                      width: `${pageWidth}mm`,
                      marginBottom: pageIndex < pageSplits.length - 1 ? 16 : 0,
                      breakAfter: pageIndex < pageSplits.length - 1 ? 'page' : 'auto',
                    }}
                  >
                    {renderPageContent(indices, pageIndex === 0)}
                  </section>
                ))}
              </>
            ) : (
              <div
                className="bg-white"
                style={{
                  ...pageStyle,
                  width: `${pageWidth}mm`,
                  minHeight: `${pageHeight}mm`,
                }}
              >
                {useBoardStyle ? (
                  <BoardStyleLayout paper={paper} baseFontSize={baseFontSize} />
                ) : (
                  <>
                    <div className="text-center mb-3 pb-3 border-b-2 border-slate-800 font-['Noto_Sans_Bengali']">
                      {paper.setup.schoolName && <h1 className="text-lg font-bold mb-1">{paper.setup.schoolName}</h1>}
                      <h2 className="text-base font-semibold mb-1">{getExamTypeBangla(paper.setup.examType)}</h2>
                      <div className="flex justify-center gap-4 text-xs"><span>শ্রেণি: {paper.setup.class}</span><span>বিষয়: {paper.setup.subject}</span></div>
                    </div>
                    <div className="flex justify-between text-xs pb-2 border-b border-slate-300 mb-2 font-['Noto_Sans_Bengali']">
                      <span>সময়: {paper.setup.timeMinutes || '0'} মিনিট</span>
                      <span>পূর্ণমান: {paper.setup.totalMarks || '0'}</span>
                    </div>
                    <div className="font-['Noto_Sans_Bengali']">
                      {paper.questions.map((q) => (
                        <div key={q.id} className="pb-2 mb-2 border-b border-slate-200 last:border-b-0">
                          <QuestionRenderer question={q} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
