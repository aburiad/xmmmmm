import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { QuestionPaper } from '../types';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

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
  const handlePrint = useReactToPrint({
    content: () => previewRef.current,
    documentTitle: `${paper.setup.subject || 'Question Paper'}_Class_${paper.setup.class}_${new Date().toISOString().split('T')[0]}`,
    onBeforeGetContent: () => {
      toast.info('প্রিন্ট প্রস্তুত হচ্ছে...');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      toast.success('প্রিন্ট সফলভাবে সম্পন্ন হয়েছে!');
    },
    onPrintError: () => {
      toast.error('প্রিন্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Hide everything except the content */
        body * {
          visibility: hidden;
        }
        
        #printable-content,
        #printable-content * {
          visibility: visible;
        }
        
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        
        /* Prevent page breaks inside questions */
        .question-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Prevent page breaks after question headers */
        .question-header {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        /* Allow page breaks between questions */
        .question-item {
          page-break-after: auto;
          break-after: auto;
        }
        
        /* Keep sub-questions together */
        .sub-question {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Ensure proper spacing */
        .question-item {
          margin-bottom: 1.5em;
        }
        
        /* Remove shadows and backgrounds for print */
        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
        
        /* Ensure borders print correctly */
        table {
          border-collapse: collapse;
        }
        
        table, th, td {
          border: 1px solid #000 !important;
        }
      }
    `,
  });

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handlePrint}
      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
    >
      <Printer className="w-4 h-4 mr-2" />
      প্রিন্ট / সেভ করুন
    </Button>
  );
};