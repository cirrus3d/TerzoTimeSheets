'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

export function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      // Verify Turnstile token first
      if (!turnstileToken) {
        setError('Please complete the security check');
        setLoading(false);
        return;
      }

      const verifyResponse = await fetch('/api/auth/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError('Security verification failed. Please try again.');
        // Reset Turnstile widget
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setLoading(false);
        return;
      }

      // Proceed with login if Turnstile verification passed
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        // Reset Turnstile on failed login
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setLoading(false);
      } else {
        // Wait a bit to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force a hard reload to ensure middleware runs
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An unexpected error occurred');
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
        TerzoTimeSheets
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            name="email"
            placeholder="admin@example.com"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => {
              setError('Security verification failed');
              setTurnstileToken(null);
            }}
            onExpire={() => {
              setTurnstileToken(null);
            }}
          />
        </div>
        <Button type="submit" disabled={loading || !turnstileToken} className="w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
