'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Leaf, LogIn, ArrowLeft, AlertCircle } from 'lucide-react'; // ✅ Added AlertCircle
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // ✅ Added error state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null); // Reset error on new attempt

    try {
      await login(phone, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      // ✅ Catch the error and show message instead of redirecting
      if (err.response?.status === 401 || err.response?.data?.message === 'Invalid credentials') {
        setErrorMsg('Invalid phone number or password. Please check your credentials.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your AgriLink account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ✅ Display the error message */}
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Create one now
            </Link>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}