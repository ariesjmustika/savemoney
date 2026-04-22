import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Navigation from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaveMoney | Personal Finance & AI Advisor",
  description: "Track your expenses, manage your family budget, and get AI-powered financial advice.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <header 
            className="glass-card" 
            style={{ 
              position: 'sticky', 
              top: '1rem', 
              margin: '0 1rem', 
              zIndex: 50, 
              padding: '0.75rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
              SaveMoney
            </div>
            <ThemeToggle />
          </header>
          <main style={{ padding: '2rem 1rem 8rem 1rem' }}>
            <PageTransition>{children}</PageTransition>
          </main>
          <Navigation />
        </ThemeProvider>
      </body>
    </html>
  );
}
