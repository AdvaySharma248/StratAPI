"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (India)" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    company: user?.company ?? "",
    timezone: user?.timezone ?? "UTC",
  });

  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedUser = await updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase(),
        company: profile.company.trim(),
        timezone: profile.timezone,
      });

      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        company: updatedUser.company,
        timezone: updatedUser.timezone,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account details</p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-6">
          <h2 className="text-base font-semibold mb-5">Profile</h2>
          <div className="max-w-lg space-y-5">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-sm">Full Name</Label>
              <Input
                id="settings-name"
                value={profile.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-sm">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-company" className="text-sm">Company</Label>
              <Input
                id="settings-company"
                value={profile.company}
                onChange={(e) => handleProfileChange("company", e.target.value)}
                className="h-10 rounded-xl"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-timezone" className="text-sm">Timezone</Label>
              <Select
                value={profile.timezone}
                onValueChange={(timezone) => handleProfileChange("timezone", timezone)}
              >
                <SelectTrigger id="settings-timezone" className="h-10 w-full rounded-xl">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="mx-6" />
        <div className="flex justify-end p-6 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white rounded-xl min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
