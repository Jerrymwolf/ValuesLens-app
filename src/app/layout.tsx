import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'ValuesLens | Discover Your Core Values',
    template: '%s | ValuesLens'
  },
  description: 'Free 7-minute assessment to discover your top values. Get AI-powered definitions and a shareable values card. Start 2026 with clarity about what matters most.',
  keywords: ['values assessment', 'personal values', 'core values test', 'self-discovery', 'decision making', '2026 goals'],
  authors: [{ name: 'CultureWright Consulting' }],
  creator: 'CultureWright Consulting',
  publisher: 'CultureWright Consulting',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ValuesLens',
    title: 'ValuesLens | Discover Your Core Values',
    description: 'Free 7-minute values assessment with AI-powered insights.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ValuesLens | Discover Your Core Values',
    description: 'Free 7-minute values assessment with AI-powered insights.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
