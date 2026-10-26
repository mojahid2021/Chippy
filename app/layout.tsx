import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BDChatPro — AI E-Commerce & Facebook Messenger Automation",
    template: "%s | BDChatPro",
  },
  description:
    "Empower your e-commerce business with BDChatPro. Automated AI chatbot responses, intelligent order taking, product catalog semantic search, and multi-tenant team collaboration for Facebook Messenger.",
  keywords: [
    "AI Chatbot",
    "F-Commerce",
    "Facebook Messenger Automation",
    "E-Commerce Chatbot",
    "Order Management",
    "Bangladesh E-Commerce",
  ],
  authors: [{ name: "BDChatPro Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BDChatPro — AI E-Commerce & Facebook Messenger Automation",
    description: "Automate sales and customer support on Facebook Messenger with intelligent AI profiles and seamless order routing.",
    siteName: "BDChatPro",
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
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
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
