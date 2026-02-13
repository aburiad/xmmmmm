import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Loader2, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call to check email against WordPress users
      const response = await fetch('https://ahsan.ronybormon.com/wp-json/myqugen/v1/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('authToken', data.auth_token);
        if (data.user_display_name) {
          localStorage.setItem('userName', data.user_display_name);
        }
        
        toast.success('Successfully logged in');
        navigate('/', { replace: true });
      } else {
        console.log('API Response:', data); 
        
        // Handle specific WordPress REST API errors
        if (data.code === 'rest_no_route') {
            toast.error('System Error: The authentication plugin is not active on the WordPress site.');
        } else {
            toast.error(data.message || 'Authentication failed. Please check your email.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Check if it's likely a 404 or network issue to give better advice
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
         toast.error('Server returned 404 or invalid JSON. Check Plugin & Permalinks.');
      } else {
         toast.error('Connection error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-500 text-base">
            Enter your email to access the Question Paper Generator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-gray-700 block"
              >
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-base"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-6 px-4 leading-relaxed">
              Restricted access for registered teachers only. Check with your administrator if you don't have an account.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}