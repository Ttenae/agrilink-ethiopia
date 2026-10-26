'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  // ✅ 1. Changed 'isLoading' to 'loading' to match AuthContext
  const { user, loading } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // 2. If not logged in, push to login (unless already on login)
      if (!user && pathname !== '/auth/login') {
        router.push('/auth/login');
      } 
      // 3. If logged in but wrong role, push to dashboard
      else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, allowedRoles, pathname]);

  // 4. While loading, show the spinner. Do not redirect.
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 5. If loading is done and no user, show a blank screen (the useEffect is redirecting)
  if (!user) {
    return null;
  }

  // 6. If role is restricted, show nothing (the useEffect is redirecting)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  // 7. All good! Render the page.
  return <>{children}</>;
};