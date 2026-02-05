"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isApplicant = pathname === "/new";

  return (
    <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold tracking-tight">ForeForms Admissions</div>
          <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
            {isApplicant ? "Applicant Portal" : "Admin Dashboard"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant={pathname === "/" ? "default" : "outline"} size="sm">
            <Link href="/">Dashboard</Link>
          </Button>
          <Button asChild variant={pathname === "/new" ? "default" : "outline"} size="sm">
            <Link href="/new">Apply</Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
