import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Web3Provider } from "@/components/providers/web3-provider";
import { Toaster } from "sonner";
import Header from "@/components/layout/header";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prediction Market - Trade the Future",
  description: "Decentralized prediction markets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Web3Provider>
            <div className="flex min-h-screen flex-col w-full">
              <Header />
              <main className="flex-1 w-full">{children}</main>
              {/* <Footer /> */}
            </div>
            <Toaster richColors position="top-right" />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
