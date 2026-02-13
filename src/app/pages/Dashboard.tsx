import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  LogOut,
  Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { HelpDialog } from '../components/HelpDialog';
import { FAB } from '../components/mobile/FAB';
import { MobileCard } from '../components/mobile/MobileCard';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useIsMobile } from '../hooks/useIsMobile';
import { QuestionPaper } from '../types';
import { deletePaper, duplicatePaper, loadPapers } from '../utils/storage';

export default function Dashboard() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  /* ✅ Proper Unicode Decoder */
  const decodeUnicodeString = (str: string): string => {
    if (!str) return '';
    return str.replace(/u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  };

  /* ✅ Clean Entire Paper Object */
  const cleanPaperData = (paper: QuestionPaper): QuestionPaper => ({
    ...paper,
    title: decodeUnicodeString(paper.title || ''),
    setup: {
      ...paper.setup,
      subject: decodeUnicodeString(paper.setup.subject || ''),
      schoolName: decodeUnicodeString(paper.setup.schoolName || ''),
      instructions: decodeUnicodeString(paper.setup.instructions || ''),
    },
    questions: Array.isArray(paper.questions) ? paper.questions : [],
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedPapers = await loadPapers();
        const cleanedPapers = loadedPapers.map(cleanPaperData);
        setPapers(cleanedPapers);
      } catch (error) {
        console.error('Error loading papers:', error);
        toast.error('Failed to load papers');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deletePaper(id);
      const updatedPapers = await loadPapers();
      setPapers(updatedPapers.map(cleanPaperData));
      toast.success('Question paper deleted');
    } catch (error) {
      toast.error('Failed to delete paper');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePaper(id);
      const updatedPapers = await loadPapers();
      setPapers(updatedPapers.map(cleanPaperData));
      toast.success('Question paper duplicated');
    } catch (error) {
      toast.error('Failed to duplicate paper');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  const getExamTypeBangla = (type: string) => {
    const map: Record<string, string> = {
      'class-test': 'শ্রেণি পরীক্ষা',
      'half-yearly': 'অর্ধ-বার্ষিক',
      'annual': 'বার্ষিক',
      'model-test': 'মডেল টেস্ট',
    };
    return map[type] || type;
  };

  const getClassBangla = (classValue: string) => {
    const map: Record<string, string> = {
      '6': '৬',
      '7': '৭',
      '8': '৮',
      '9': '৯',
      '10': '১০',
    };
    return map[classValue] || classValue;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">বাংলাদেশ বোর্ড প্রশ্নপত্র জেনারেটর</h1>
                <p className="text-sm text-slate-500">Question Paper Generator</p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <HelpDialog />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
              <Button onClick={() => navigate('/setup')}>
                <Plus className="w-4 h-4 mr-2" />
                নতুন প্রশ্নপত্র তৈরি করুন
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-8'}`}>
        {papers.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-medium">কোন প্রশ্নপত্র নেই</h2>
            <p className="text-slate-500 mb-6">নতুন একটি প্রশ্নপত্র তৈরি করে শুরু করুন</p>
            <Button onClick={() => navigate('/setup')}>
              <Plus className="w-4 h-4 mr-2" />
              প্রথম প্রশ্নপত্র তৈরি করুন
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-semibold text-lg">
                আপনার প্রশ্নপত্রসমূহ
              </h2>
              <p className="text-sm text-slate-500">
                মোট {papers.length}টি প্রশ্নপত্র
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {papers.map((paper) => {
                const CardComponent = isMobile ? MobileCard : Card;

                return (
                  <CardComponent key={paper.id} className="hover:shadow-md group">
                    <CardHeader>
                      <CardTitle className="mb-1 group-hover:text-blue-600 transition-colors">
                        শ্রেণি {getClassBangla(paper.setup.class)}
                      </CardTitle>
                      <CardDescription>
                        {getExamTypeBangla(paper.setup.examType)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">

                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {getExamTypeBangla(paper.setup.examType)}
                          </Badge>
                          <Badge variant="outline">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {paper.questions.length} প্রশ্ন
                          </Badge>
                        </div>

                        <div className="flex justify-between text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {paper.setup.timeMinutes} মিনিট
                          </div>
                          <div>
                            মোট নম্বর: {paper.setup.totalMarks}
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 border-t pt-2">
                          শেষ আপডেট:{' '}
                          {new Date(paper.updatedAt).toLocaleDateString('bn-BD')}
                        </div>
                      </div>
                    </CardContent>
                  </CardComponent>
                );
              })}
            </div>
          </>
        )}
      </div>

      {isMobile && (
        <FAB
          onClick={() => navigate('/setup')}
          label="নতুন প্রশ্নপত্র তৈরি করুন"
        />
      )}
    </div>
  );
}
