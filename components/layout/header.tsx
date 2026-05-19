"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="w-full flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Satta
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link href="/markets" className="text-sm font-medium hover:text-primary">
              Markets
            </Link>
            
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary">
              Position Trading
            </Link>

            <Link href="/portfolio" className="text-sm font-medium hover:text-primary">
              Portfolio
            </Link>
            {/* <Link href="/history" className="text-sm font-medium hover:text-primary">
              History
            </Link> */}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
          </Button>

          <Link href="/create">
            <Button>Create Market</Button>
          </Link>

          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
