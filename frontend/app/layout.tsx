import type { Metadata, Viewport } from 'next';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GrowEasy · AI CSV → CRM Importer',
  description:
    'Upload any CSV — Facebook, Google Ads, real-estate CRM, or a hand-made sheet — and let AI map it into clean GrowEasy CRM records.',
  applicationName: 'GrowEasy CSV Importer',
  authors: [{ name: 'GrowEasy' }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f0c' },
  ],
};

/** Set the theme class before paint to avoid a flash of the wrong theme. */
const themeInit = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark || stored === null;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased`}
      >
        <div className="mesh-bg" aria-hidden />
        <div className="grain-overlay" aria-hidden />
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  );
}
