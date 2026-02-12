import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSubscription } from '../context/SubscriptionContext';
import { Button } from '../components/ui/button';
import { BookOpen, Lock, User, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useSubscription();
  
  const [formData, setFormData] = useState({
    url: localStorage.getItem('wp_site_url') || '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic Validation
    if (!formData.url || !formData.username || !formData.password) {
      toast.error('সব তথ্য পূরণ করুন');
      setLoading(false);
      return;
    }

    // Clean URL
    let siteUrl = formData.url.replace(/\/$/, ''); // Remove trailing slash
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }

    try {
      // Save URL for future
      localStorage.setItem('wp_site_url', siteUrl);

      // Attempt Login
      // Note: We are calling the Context login function which should handle the API call
      // But for now, we will pass the credentials to it
      const success = await login(formData.username, formData.password, siteUrl);
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      toast.error('লগইন ব্যর্থ হয়েছে। তথ্য সঠিক কিনা যাচাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          প্রশ্নপত্র জেনারেটর
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          আপনার স্কুলের অ্যাকাউন্টে লগইন করুন
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Website URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-700">
                ওয়েবসাইট URL (WordPress)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="url"
                  name="url"
                  type="text"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://myschool.com"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">যে সাইটে প্লাগিন ইন্সটল দিয়েছেন</p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                ইউজারনেম
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                পাসওয়ার্ড
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  'লগইন করুন'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  অথবা
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
               <div className="text-center text-xs text-slate-400">
                  আপনার স্কুল এডমিনের সাথে যোগাযোগ করুন ক্রেডেনশিয়াল এর জন্য
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}