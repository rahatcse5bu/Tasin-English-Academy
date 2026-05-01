import './globals.css';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'তাসিন ইংলিশ একাডেমি | Tasin English Academy',
  description:
    'HSC ও SSC শিক্ষার্থীদের জন্য সাশ্রয়ী লাইভ অনলাইন ক্লাস — ইংরেজি ১ম, ২য় পত্র ও আইসিটি। প্রিমিয়াম ও জেনারেল ব্যাচ।',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f5fe6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
