"use client";

import { useState } from "react";
import { Zap, ArrowRight, Shield, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole, roleConfig } from "@/lib/auth";
import { cn } from "@/lib/utils";

const roleOptions: { role: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  { role: "owner", label: "API Owner", description: "Full access to dashboard, APIs, billing & analytics", icon: <Crown size={20} /> },
  { role: "consumer", label: "Consumer", description: "View usage, API keys assigned to you", icon: <Users size={20} /> },
  { role: "admin", label: "Admin", description: "Manage users, APIs, and system monitoring", icon: <Shield size={20} /> },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    login(email.trim(), selectedRole);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-chart-3/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">MeterFlow</h1>
          <p className="text-sm text-muted-foreground">Usage-Based API Billing Platform</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="h-10 rounded-xl"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sign in as</Label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => {
                  const cfg = roleConfig[opt.role];
                  const isSelected = selectedRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setSelectedRole(opt.role)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {opt.icon}
                      </div>
                      <span className={cn(
                        "text-xs font-medium",
                        isSelected ? cfg.color : "text-muted-foreground"
                      )}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" className="gradient-primary text-white w-full rounded-xl h-10 glow-shadow-sm hover:opacity-90 transition-opacity">
              Sign In
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This is a demo — any email works. Choose a role to explore the UI.
        </p>
      </div>
    </div>
  );
}
