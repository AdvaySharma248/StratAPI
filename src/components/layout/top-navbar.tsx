"use client";

import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Search, Bell, Moon, Sun, Command, Menu, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth, roleConfig } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { setCommandOpen, toggleSidebar } = useAppStore();
  const { user, logout } = useAuth();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    },
    [setCommandOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "JD";

  const cfg = user ? roleConfig[user.role] : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: mobile menu + search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl lg:hidden shrink-0"
          onClick={toggleSidebar}
        >
          <Menu size={18} className="text-muted-foreground" />
        </Button>
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="h-9 pl-9 rounded-xl bg-muted/50 border-transparent focus:border-border focus:bg-background transition-colors text-sm"
            readOnly
            onClick={() => setCommandOpen(true)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command size={10} />K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Role badge */}
        {cfg && (
          <Badge
            variant="outline"
            className={cn(
              "hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold border tracking-wider",
              cfg.bgColor,
              cfg.color
            )}
          >
            {cfg.label}
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-muted-foreground" />
          ) : (
            <Moon size={18} className="text-muted-foreground" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-xl px-2 h-9">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="gradient-primary text-[10px] text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{user?.name ?? "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem className="rounded-lg cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive" onClick={logout}>
              <LogOut size={14} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
