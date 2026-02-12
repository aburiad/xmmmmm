import React from 'react';
import { useNavigate } from 'react-router';
import { useSubscription } from '../context/SubscriptionContext';
import { 
  Plus, 
  FileText, 
  Users, 
  Settings, 
  ShieldCheck, 
  LayoutDashboard,
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { loadPapers } from '../utils/storage';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, subscription, isSubscriptionValid } = useSubscription();
  const papers = loadPapers();
  const isValid = isSubscriptionValid();

  const stats = [
    { label: 'মোট প্রশ্নপত্র', value: papers.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'সক্রিয় শিক্ষক', value: subscription.used_teacher_count, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'টিচার লিমিট', value: subscription.teacher_limit, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            স্বাগতম, {user?.name}
          </h1>
          <p className="text-slate-500 mt-1">আপনার শিক্ষা প্রতিষ্ঠানের প্রশ্নপত্র ম্যানেজমেন্ট ড্যাশবোর্ড</p>
        </div>
        <div className="flex gap-2">
          {isValid && (
            <Button 
              onClick={() => navigate('/setup')} 
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 px-6 py-6 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              নতুন প্রশ্নপত্র তৈরি করুন
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Alert */}
      {!isValid && user?.role !== 'super_admin' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 text-red-700 animate-pulse">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">সতর্কবার্তা!</p>
            <p className="text-sm">আপনার সাবস্ক্রিপশন নিষ্ক্রিয় অথবা মেয়াদ শেষ হয়ে গেছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => navigate('/subscription')}>
            রিনিউ করুন
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Papers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              সাম্প্রতিক প্রশ্নপত্র
            </h2>
          </div>
          <div className="space-y-3">
            {papers.slice(0, 5).map((paper) => (
              <div 
                key={paper.id} 
                className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate(`/builder/${paper.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                      {paper.setup.class}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{paper.setup.subject}</h3>
                      <p className="text-xs text-slate-400">{paper.setup.examType} • {paper.questions.length} প্রশ্ন</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
            {papers.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400">কোনো প্রশ্নপত্র খুঁজে পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links / Status */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              সিস্টেম স্ট্যাটাস
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">রোল</span>
                <span className="bg-blue-600 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">সাবস্ক্রিপশন</span>
                <span className={isValid ? 'text-green-400' : 'text-red-400'}>
                  {isValid ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">মেয়াদ</span>
                <span>{subscription.expire_date}</span>
              </div>
            </div>
            <Button 
              className="w-full mt-6 bg-slate-800 hover:bg-slate-700 border border-slate-700"
              onClick={() => navigate('/subscription')}
            >
              ম্যানেজ করুন
            </Button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              দ্রুত লিঙ্ক
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => navigate('/subscription')}>
                <Users className="w-4 h-4 mr-2" /> শিক্ষক
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" /> সেটিংস
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
