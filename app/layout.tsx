import type { Metadata, Viewport } from "next";
import { Anek_Bangla, Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// Bengali glyphs fall through to Anek Bangla.
const anekBangla = Anek_Bangla({
  variable: "--font-anek",
  subsets: ["bengali"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Chippy — Your Facebook page, answering and selling on its own",
    template: "%s · Chippy",
  },
  description:
    "Chippy replies to Messenger customers in Bangla, Banglish, and English, checks your stock, and turns chats into orders.",
  keywords: ["Messenger chatbot", "F-commerce", "Facebook page automation", "Bangladesh e-commerce", "AI sales assistant"],
  applicationName: "Chippy",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Chippy — Your Facebook page, answering and selling on its own",
    description: "Replies in Bangla and Banglish, checks stock, and creates the order.",
    siteName: "Chippy",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F3F4F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geist.variable} ${bricolage.variable} ${anekBangla.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
