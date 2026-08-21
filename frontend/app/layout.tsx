import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/layout/header';
import { Footer } from '../components/layout/footer';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'AgriLink Ethiopia',
  description: 'Agricultural Marketplace and Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
const inter = Inter({ subsets: ['latin'] });
