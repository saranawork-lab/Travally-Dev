import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "@/context/AuthContext";
import BrandIntroLoader from "@/components/common/BrandIntroLoader";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import { GlobalIncomingCallListener } from "@/components/chat/GlobalIncomingCallListener";
import PrimaryNavigation from "@/components/layout/PrimaryNavigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://travally.in"),
  title: {
    default: "Travally — Social Travel Companion & Activity Discovery",
    template: "%s | Travally",
  },
  description:
    "Travally is the ultimate social travel companion app. Find verified travel buddies, plan trips, discover local activities, and connect with travelers worldwide. Find your perfect travel partner for backpacking, road trips, and city exploration.",
  keywords: [
    "travel companion app",
    "find travel buddy",
    "travel partner",
    "solo travel companions",
    "backpacking companion",
    "travel networking",
    "find someone to travel with",
    "social travel app",
    "travally",
    "local activity partner",
    "trip planning community",
    "travel meetups"
  ],
  authors: [{ name: "Travally Platform" }],
  creator: "Travally",
  publisher: "Travally",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Travally — Social Travel Companion & Discovery",
    description:
      "Find genuine companions for everyday activities and upcoming travel with mutual approval and transparent compatibility.",
    url: "https://travally.in",
    siteName: "Travally",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Travally - Find your travel companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Travally — Social Travel Companion Platform",
    description:
      "Find companions for everyday activities and travel adventures with mutual approval and safe coordination.",
    images: ["/og-image.jpg"],
    creator: "@travally",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "SDQ6ovdr9z7snwc1vv94LM1ywfHZFr_x5iVIMKMPjpY",
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#090d0b' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enforce light mode only
              document.documentElement.classList.remove('dark');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased bg-[#f8fafc] dark:bg-[#090d0b] text-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <AuthProvider initialUser={currentUser}>
            <BrandIntroLoader />
            <GlobalIncomingCallListener />
            <Navbar initialUser={currentUser} />
            <PrimaryNavigation initialUser={currentUser} />
            <div className="flex-1 flex min-w-0">
              <DesktopSidebar initialUser={currentUser} />
              <main className="flex-1 min-w-0">{children}</main>
            </div>
            <Footer initialUser={currentUser} />
            <BottomNav initialUser={currentUser} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

