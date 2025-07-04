import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BaseProviders } from "@/components/auth/providers";
import { TRPCProvider } from "@/lib/trpc/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaMap241",
  description: "Le jeu consiste en une bataille pour conserver la main, le joueur joue une carte d'une famille et l'adversaire doit pour gagner la main aligner une carte de la même famille",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    

          
          <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <BaseProviders>
            {children}
          </BaseProviders>
        </TRPCProvider>
      </body>
      
    </html>
        
     
  );
}
