import type { Metadata } from 'next';
import '@/styles/globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

export const metadata: Metadata = {
  title: {
    default: 'موفي ماي سيما - MovieMyCima | مشاهدة الأفلام والمسلسلات',
    template: '%s | موفي ماي سيما',
  },
  description: 'شاهد أحدث الأفلام والمسلسلات العربية والعالمية مترجمة ومدبلجة بجودة عالية على موفي ماي سيما',
  keywords: ['أفلام', 'مسلسلات', 'سينما', 'movie', 'streaming', 'Arabic movies'],
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    siteName: 'MovieMyCima',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-dark-950 text-white min-h-screen" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
