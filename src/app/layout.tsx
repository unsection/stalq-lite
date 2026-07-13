import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { AppSidebar } from "@/components/AppSidebar";
import { PhosphorProvider } from "@/components/PhosphorProvider";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Stalq Lite — Price Monitoring",
  description: "Monitor product prices with Context.dev scraping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} h-full`}>
      <body className="min-h-full bg-black text-zinc-100 antialiased">
        <PhosphorProvider>
          <div className="flex min-h-full">
            <AppSidebar />
            <main className="min-w-0 flex-1 overflow-x-auto">
              <div className="mx-auto w-full max-w-[1400px] px-6 py-8">{children}</div>
            </main>
          </div>
        </PhosphorProvider>
      </body>
    </html>
  );
}
