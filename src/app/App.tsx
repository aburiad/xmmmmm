import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { SubscriptionProvider } from './context/SubscriptionContext';

export default function App() {
  return (
    <SubscriptionProvider>
      <RouterProvider router={router} />
      <Toaster />
    </SubscriptionProvider>
  );
}
