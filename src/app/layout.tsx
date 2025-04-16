
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {SidebarProvider} from '@/components/ui/sidebar';
import {ThemeProvider} from 'next-themes';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ChatMate',
  description: 'Your AI Powered Chatbot',
  // Replace with actual Luminous logo URL
  icons: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freelogovectors.net%2Fluminous-logo%2F&psig=AOvVaw3Rx4h-_ucoB9eMkECGL_0h&ust=1744881556767000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCMDL2ruc3IwDFQAAAAAdAAAAABAE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

