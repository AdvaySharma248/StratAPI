"use client";

import { useState } from "react";
import { Zap, ArrowRight, Shield, Users, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole, roleConfig } from "@/lib/auth";
import { roleLabels } from "@/lib/auth-model";
import { cn } from "@/lib/utils";

const roleOptions: { role: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  { role: "owner", label: "API Owner", description: "Full access to dashboard, APIs, billing, and analytics.", icon: <Crown size={20} /> },
  { role: "consumer", label: "Consumer", description: "View usage and access the API keys assigned to you.", icon: <Users size={20} /> },
  { role: "admin", label: "Admin", description: "Manage users, APIs, and system monitoring.", icon: <Shield size={20} /> },
];

type AuthMode = "signin" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegisterMode = mode === "register";
  const selectedRoleDetails = roleOptions.find((option) => option.role === selectedRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (isRegisterMode && trimmedName.length < 2) {
      setError("Please enter your full name");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const result = await register({
          name: trimmedName,
          email: trimmedEmail,
          password,
          role: selectedRole,
          username: username.trim() || undefined,
        });
        const displayUsername = (result as { user?: { username?: string } })?.user?.username;
        toast.success(
          displayUsername
            ? `Account created! Your username is @${displayUsername}`
            : `${roleLabels[selectedRole]} account created.`
        );
      } else {
        await login({
          email: trimmedEmail,
          password,
          role: selectedRole,
        });
        toast.success(`Signed in as ${roleLabels[selectedRole]}.`);
      }
    } catch (authError) {
      const nextError = authError instanceof Error ? authError.message : "Unable to continue right now.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">StratAPI</h1>
          <p className="text-sm text-muted-foreground">Usage-Based API Billing Platform</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Create Account
              </button>
            </div>

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name" type="text" placeholder="Advay Sharma"
                  value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
                  className="h-10 rounded-lg"
                />
              </div>
            )}

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-muted-foreground font-normal text-xs">(optional — auto-generated if blank)</span>
                </Label>
                <Input
                  id="username" type="text" placeholder="e.g. john_dev"
                  value={username} onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setError(""); }}
                  className="h-10 rounded-lg font-mono"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground">
                  Share your username with API owners to receive assigned keys.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegisterMode ? "Create a secure password" : "Enter your password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-10 rounded-lg"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{isRegisterMode ? "Create account as" : "Sign in as"}</Label>
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
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {opt.icon}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isSelected ? cfg.color : "text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedRoleDetails && (
                <p className="text-xs text-muted-foreground">{selectedRoleDetails.description}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary text-white w-full rounded-lg h-10 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? (isRegisterMode ? "Creating Account..." : "Signing In...")
                : (isRegisterMode ? "Create Account" : "Sign In")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure access is enabled. Use your registered email, password, and role to enter the correct workspace.
        </p>
      </div>
    </div>
  );
}
