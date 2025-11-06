'use client';

import Image from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      // Show success state briefly
      setLoginSuccess(true);
      
      // Ultra-fast redirect - minimal delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirectTo = data?.redirectTo || '/';
      router.push(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
    // Note: Don't set loading to false on success - let the page redirect
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-500 items-center justify-center px-4">
      <div className="flex justify-center mb-6 animate-fade-in">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-2 shadow-xl">
          <Image
            src="/logo.jpg"
            alt="Logo"
            width={90}
            height={90}
            className="rounded-full object-cover"
            priority
          />
        </div>
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <Card className="bg-blue-200 text-blue-800 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">G-45 Main</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to sign in to your account.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center relative">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2 animate-spin" />
                  <p className="text-blue-600 font-medium text-sm">Signing in...</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="w-full max-w-md">
                  <Alert variant="destructive" className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-1" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="space-y-2">
                <input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800 placeholder-blue-600"
                />
              </div>

              <div className="space-y-2">
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 bg-white/90 text-blue-800 placeholder-blue-600"
                />
              </div>

              <CardFooter className="text-center">
                <Button
                  className={`w-full transition-all duration-500 transform ${
                    loginSuccess
                      ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-lg'
                      : isLoading 
                      ? 'bg-blue-600 hover:bg-blue-700 scale-102 shadow-md' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white font-semibold py-3 rounded-lg`}
                  type="submit"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-2">
                    {loginSuccess ? (
                      <>
                        <div className="w-5 h-5 text-white">
                          ✓
                        </div>
                        <span>Success! Redirecting...</span>
                      </>
                    ) : isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </div>
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

