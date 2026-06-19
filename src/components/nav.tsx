"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChefHat, Heart, Clock, ShoppingCart, Settings, LogOut, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/generate", label: "Generate", icon: ChefHat },
  { href: "/pantry", label: "My Fridge", icon: Package },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "History", icon: Clock },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingCart },
];

interface NavProps {
  displayName: string;
  avatarUrl?: string | null;
}

export function Nav({ displayName, avatarUrl }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  async function handleSignOut() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/generate" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl leading-none">🍽️</span>
            <span className="font-display text-xl font-bold text-foreground hidden sm:block">
              Plateful
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="User menu"
              >
                <Avatar className="w-8 h-8">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback className="bg-secondary/30 text-secondary-foreground text-xs font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-border/60">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile &amp; Diet
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-border/60" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "scale-110")} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
