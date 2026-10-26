'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sprout, LogOut, User as UserIcon, Bell, Search, Menu, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth(); // ✅ Make sure your AuthContext exposes 'loading'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. SHOW LOADING STATE (Prevents crash while checking auth)
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">AgriLink</span>
          </Link>
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
        </div>
      </header>
    );
  }

  // 2. GUEST VIEW (Not logged in)
  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">AgriLink</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost" className="text-gray-700">Login</Button></Link>
            <Link href="/auth/register"><Button className="bg-green-600 hover:bg-green-700 text-white">Sign Up</Button></Link>
          </div>
        </div>
      </header>
    );
  }

  // 3. LOGGED IN VIEW
  let navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Market', href: '/market' },
    { name: 'Weather', href: '/weather' },
    { name: 'Assistant', href: '/chatbot' },
    { name: 'Messages', href: '/chat' },
  ];

  if (user?.role === 'FARMER') {
    navLinks.splice(1, 0, { name: 'My Products', href: '/products/my' });
    navLinks.splice(4, 0, { name: 'AI Detection', href: '/ai/disease-detection' });
  } else if (user?.role === 'BUYER') {
    navLinks.splice(1, 0, { name: 'Browse', href: '/products' });
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">AgriLink</span>
          </Link>
        </div>

        <nav className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}
              className={`relative flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                isActive(link.href) ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              {link.name}
              {isActive(link.href) && <span className="absolute bottom-0 left-1/2 h-0.5 w-4/5 -translate-x-1/2 rounded-t-full bg-green-600" />}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/products" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors" title="Search Products">
            <Search className="h-4 w-4" />
          </Link>
          
          <Link href="/notifications" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative" title="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </Link>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.name || 'User'}</p>
              {/* ✅ Added optional chaining (?.) and fallback text to prevent crash */}
              <p className="text-xs text-gray-500 mt-1 capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
            </div>
            
            {user?.avatarUrl ? (
              <img 
                src={`http://localhost:3005${user.avatarUrl}`} 
                alt={user.name} 
                className="h-9 w-9 rounded-full object-cover border border-green-200 shadow-sm"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 border border-green-200 text-green-700">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </Link>

          <Button variant="ghost" size="icon" onClick={logout} className="text-gray-500 hover:text-red-600 hover:bg-red-50 h-9 w-9 ml-1" title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Profile Icon */}
        <div className="md:hidden flex items-center">
           <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 border border-green-200 text-green-700 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={`http://localhost:3005${user.avatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </Link>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg absolute w-full">
          <div className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${isActive(link.href) ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-gray-200 my-2"></div>
            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg w-full text-left">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}