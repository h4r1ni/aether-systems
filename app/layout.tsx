import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Aether Systems | Custom Business Systems Built to Scale',
  description: 'Tailored workflows, integrations, and automation designed around your unique operations. We build custom business systems that scale with your growth.',
  keywords: 'business systems, integrations, automation, custom workflows, business solutions, scheduling, payment processing, CRM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
