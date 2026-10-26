'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { 
  Sprout, LogOut, User as UserIcon, Bell, Search, Menu, X, 
  Loader2, ChevronDown, Package, ShoppingBag, BarChart3, 
  Stethoscope, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. SHOW LOADING STATE
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

  // 2. GUEST VIEW
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
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Mobile Toggle */}
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

        {/* Desktop Navigation (Grouped) */}
        <nav className="hidden md:flex md:items-center md:space-x-1">
          <Link href="/dashboard" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/dashboard') ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Dashboard
          </Link>

          {/* Marketplace Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors outline-none ${(isActive('/products') || isActive('/market')) ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              Marketplace <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {user.role === 'FARMER' ? (
                <Link href="/products/my">
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Package className="h-4 w-4" /> My Products
                  </DropdownMenuItem>
                </Link>
              ) : (
                <Link href="/products">
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <ShoppingBag className="h-4 w-4" /> Browse Products
                  </DropdownMenuItem>
                </Link>
              )}
              <Link href="/market">
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Activity className="h-4 w-4" /> Live Market
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/weather" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/weather') ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Weather
          </Link>

          {/* Farmer-Only Tools Dropdown */}
          {user.role === 'FARMER' && (
            <DropdownMenu>
              <DropdownMenuTrigger className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors outline-none ${(isActive('/analytics') || isActive('/ai')) ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                Tools <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <Link href="/ai/disease-detection">
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Stethoscope className="h-4 w-4" /> AI Detection
                  </DropdownMenuItem>
                </Link>
                <Link href="/analytics">
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <BarChart3 className="h-4 w-4" /> Analytics
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Link href="/chatbot" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/chatbot') ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Assistant
          </Link>

          <Link href="/chat" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/chat') ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Messages
          </Link>
        </nav>

        {/* Right Side: User Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/products" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors" title="Search">
            <Search className="h-4 w-4" />
          </Link>
          
          <Link href="/notifications" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative" title="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
          </Link>

          <div className="h-6 w-px bg-gray-200 mx-1"></div>

          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.name?.split(' ')[0] || 'User'}</p>
              <p className="text-[11px] text-gray-500 mt-1 capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
            </div>
            
            {user?.avatarUrl ? (
              <img src={`http://localhost:3005${user.avatarUrl}`} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-green-200" />
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
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg absolute w-full max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col p-4 space-y-1">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</Link>
            
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Marketplace</div>
            <Link href={user.role === 'FARMER' ? "/products/my" : "/products"} onClick={() => setIsMobileMenuOpen(false)} className="px-8 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              {user.role === 'FARMER' ? "My Products" : "Browse Products"}
            </Link>
            <Link href="/market" onClick={() => setIsMobileMenuOpen(false)} className="px-8 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Live Market</Link>

            <Link href="/weather" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 mt-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Weather</Link>

            {user.role === 'FARMER' && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Farmer Tools</div>
                <Link href="/ai/disease-detection" onClick={() => setIsMobileMenuOpen(false)} className="px-8 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">AI Detection</Link>
                <Link href="/analytics" onClick={() => setIsMobileMenuOpen(false)} className="px-8 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Analytics</Link>
              </>
            )}

            <Link href="/chatbot" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 mt-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Assistant</Link>
            <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Messages</Link>

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