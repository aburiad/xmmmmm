/**
 * =====================================================
 * Application Routes Configuration
 * =====================================================
 * এই ফাইলে React Router এর সব routes configure করা হয়েছে
 * 
 * Routes:
 * - / : Dashboard (হোম পেজ)
 * - /setup/:paperId : Paper Setup পেজ
 * - /builder/:paperId : Question Builder পেজ
 * - /preview/:paperId : A4 Preview পেজ
 * - * : Not Found পেজ (যদি কোনো route match না করে)
 */

import { createBrowserRouter } from 'react-router';

// Pages import করা হচ্ছে
import Dashboard from './pages/Dashboard';
import PaperSetup from './pages/PaperSetup';
import QuestionBuilder from './pages/QuestionBuilder';
import A4Preview from './pages/A4Preview';
import NotFound from './pages/NotFound';
import Login from './app/pages/Login';
import SubscriptionPage from './app/pages/Subscription';
import ProtectedRoute from './app/components/ProtectedRoute';

/**
 * Router configuration তৈরি করা হচ্ছে
 * createBrowserRouter ব্যবহার করে React Router v6 এর Data mode enable করা হয়েছে
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/', // Root path
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscription',
    element: (
      <ProtectedRoute>
        <SubscriptionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/setup/:paperId', // Paper setup করার page (:paperId হলো dynamic parameter)
    element: (
      <ProtectedRoute>
        <PaperSetup />
      </ProtectedRoute>
    ),
  },
  {
    path: '/builder/:paperId', // Question তৈরি করার page
    element: (
      <ProtectedRoute>
        <QuestionBuilder />
      </ProtectedRoute>
    ),
  },
  {
    path: '/preview/:paperId', // A4 format এ preview দেখার page
    element: (
      <ProtectedRoute>
        <A4Preview />
      </ProtectedRoute>
    ),
  },
  {
    path: '*', // যদি কোনো route match না করে, তাহলে Not Found page দেখাবে
    Component: NotFound,
  },
]);
