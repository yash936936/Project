import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI System Design Assistant',
  description: 'Generate production-ready system designs from natural language',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
