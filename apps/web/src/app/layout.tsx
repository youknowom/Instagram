import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot — Instagram Automation for Creators',
  description:
    'Create Instagram posts with AI copy, live visual search, and a connected publishing queue.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="theme-preference" strategy="beforeInteractive">
          {`try { var savedTheme = localStorage.getItem('postpilot-theme'); if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme; } catch (_) {}`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
