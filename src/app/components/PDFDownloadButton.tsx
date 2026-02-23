import { Printer } from 'lucide-react';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from './ui/button';

interface PDFDownloadButtonProps {
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ previewRef }) => {
  const handlePrint = useReactToPrint({
    contentRef: previewRef,
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
