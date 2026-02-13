import { Navigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const authToken = localStorage.getItem('authToken');
      const userEmail = localStorage.getItem('userEmail');

      if (!isAuthenticated || !authToken || !userEmail) {
        setIsValid(false);
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('https://ahsan.ronybormon.com/wp-json/myqugen/v1/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token: authToken,
            email: userEmail 
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setIsValid(true);
        } else {
          // Token is invalid - clear localStorage
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          
          if (data.code === 'invalid_token') {
            toast.error('You have been logged out. You may have logged in from another device.');
          } else {
            toast.error('Session expired. Please login again.');
          }
          setIsValid(false);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // On network error, allow access if localStorage says authenticated
        setIsValid(true);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}