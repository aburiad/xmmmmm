import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Printer } from 'lucide-react';
import { QuestionPaper } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { ensureFontsLoaded, createStyledClone, cleanupElement } from '../utils/fontLoader';

interface PDFDownloadButtonProps {
  paper: QuestionPaper;
  pageSettings: {
    pageWidth: number;
    pageHeight: number;
    pageMargin: number;
  };
  previewRef: React.RefObject<HTMLDivElement>;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ 
  paper, 
  pageSettings,
  previewRef 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Detect if device is mobile/tablet
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth < 768;
  };

  // Desktop: Use Browser Print API
  const handlePrint = () => {
    toast.info('Print dialog খুলছে...');
    window.print();
  };

  // Mobile: Use html2canvas + jsPDF
  const handleMobileDownload = async () => {
    if (!previewRef.current) {
      toast.error('Preview not found');
      return;
    }

    let tempWrapper: HTMLElement | null = null;

    try {
      setIsGenerating(true);
      toast.info('PDF তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন');

      console.log('[PDF] Starting font loading...');
      await ensureFontsLoaded();
      console.log('[PDF] Fonts loaded successfully');

      console.log('[PDF] Creating styled clone...');
      tempWrapper = await createStyledClone(previewRef.current);
      const clone = tempWrapper.firstChild as HTMLElement;
      console.log('[PDF] Clone created with dimensions:', clone.offsetWidth, 'x', clone.offsetHeight);

      console.log('[PDF] Starting canvas capture...');
      const canvas = await html2canvas(clone, {
        scale: 2, // Reduced scale for mobile performance
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 15000,
        removeContainer: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        foreignObjectRendering: false,
      });
      console.log('[PDF] Canvas captured:', canvas.width, 'x', canvas.height);
      
      // Clean up temporary wrapper
      cleanupElement(tempWrapper);
      tempWrapper = null;
      console.log('[PDF] Temporary elements cleaned up');

      // Calculate PDF dimensions (A4 in mm: 210 x 297)
      const imgWidth = pageSettings.pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      console.log('[PDF] PDF dimensions:', imgWidth, 'x', imgHeight, 'mm');

      // Create PDF with proper orientation
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Convert canvas to high quality JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      console.log('[PDF] Image data created');
      
      // Add image to PDF - if content is longer than one page, add multiple pages
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = pageSettings.pageHeight;
      let pageCount = 1;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
        pageCount++;
      }
      console.log('[PDF] Created', pageCount, 'page(s)');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `question-paper_${timestamp}.pdf`;
      
      console.log('[PDF] Saving as:', fileName);

      // Download
      pdf.save(fileName);
      toast.success('PDF সফলভাবে ডাউনলোড হয়েছে!');
      console.log('[PDF] Download complete');
    } catch (error) {
      console.error('[PDF] Generation error:', error);
      toast.error('PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      if (tempWrapper) {
        console.log('[PDF] Cleaning up temporary wrapper');
        cleanupElement(tempWrapper);
      }
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (isMobileDevice()) {
      // Mobile: Use html2canvas approach
      handleMobileDownload();
    } else {
      // Desktop: Use Print API
      handlePrint();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={isGenerating}
        onClick={handleDownload}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {isMobileDevice() ? (
          <>
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড করুন'}
          </>
        ) : (
          <>
            <Printer className="w-4 h-4 mr-2" />
            Print করুন (Save as PDF)
          </>
        )}
      </Button>
      
      {/* Alternative button for desktop users who want direct download */}
      {!isMobileDevice() && (
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating}
          onClick={handleMobileDownload}
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGenerating ? 'তৈরি হচ্ছে...' : 'Direct Download'}
        </Button>
      )}
    </div>
  );
};