import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot — Instagram Automation for Creators',
  description:
    'Automate your Instagram content pipeline. AI-powered quote generation, Pinterest-quality visuals, scheduled posting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
