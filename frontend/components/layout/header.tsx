'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Leaf, LogOut, User, ShoppingBag, LayoutDashboard, MessageCircle, BarChart3, Package, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api/client';

export const Header = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/chat/unread-count');
        setUnreadCount(response.data);
      } catch (error) {
        console.log('Chat unread count not available');
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AgriLink</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {/* Products is always visible */}
            <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>

            {/* Show marketing links only when NOT logged in */}
            {!user && (
              <>
                <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
                <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                  Testimonials
                </Link>
              </>
            )}

            {/* Show dashboard links only when logged in */}
            {user && (
              <>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                {user.role === 'FARMER' && (
                  <>
                    <Link href="/products/my" className="text-muted-foreground hover:text-foreground transition-colors">
                      My Products
                    </Link>
                    {/* ✅ AI Disease Detection - Only for Farmers */}
                    <Link href="/ai/disease-detection" className="text-muted-foreground hover:text-foreground transition-colors">
                      AI Detection
                    </Link>
                  </>
                )}
                <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors relative">
                  Chat
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-3 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                {(user.role === 'ADMIN' || user.role === 'FARMER') && (
                  <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                    Analytics
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right side - Auth buttons / User menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};