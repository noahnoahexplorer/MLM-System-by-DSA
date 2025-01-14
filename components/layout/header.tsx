"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const { setTheme, theme } = useTheme();
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="border-b">
      <div className="flex h-20 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-[240px]">
            {!logoError ? (
              <Image
                src="/logo.gif"
                alt="BK8 Logo"
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                priority
              />
            ) : (
              <div className="flex h-full items-center">
                <span className="text-3xl font-bold text-primary">BK8</span>
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}