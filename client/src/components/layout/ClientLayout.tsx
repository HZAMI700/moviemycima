'use client';

import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a24',
            color: '#f1f1f1',
            border: '1px solid #2a2a3a',
          },
        }}
      />
    </>
  );
}
