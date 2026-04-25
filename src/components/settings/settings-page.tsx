"use client";

import { useState } from "react";
import { User, Globe, Shield, Webhook, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: <User size={16} /> },
  { id: "api", label: "API Settings", icon: <Globe size={16} /> },
  { id: "ratelimit", label: "Rate Limiting", icon: <Shield size={16} /> },
  { id: "webhooks", label: "Webhooks", icon: <Webhook size={16} /> },
];

export function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@meterflow.io",
    company: "MeterFlow Inc.",
    timezone: "UTC",
  });
  const [apiSettings, setApiSettings] = useState({
    baseUrl: "api.meterflow.io",
    version: "v2",
    timeout: "30",
    retries: "3",
  });
  const [rateLimit, setRateLimit] = useState({
    enabled: true,
    requestsPerMin: "100",
    burstLimit: "150",
  });
  const [webhooks, setWebhooks] = useState({
    enabled: true,
    url: "https://hooks.example.com/meterflow",
    events: ["request.failed", "quota.exceeded"],
    secret: "whsec_••••••••••••",
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your account and API preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Tabs defaultValue="profile" className="w-full">
          <div className="border-b border-border px-6">
            <TabsList className="h-14 w-full justify-start rounded-none bg-transparent p-0 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative h-full rounded-none px-4 pb-3 pt-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100 after:transition-opacity"
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="p-6 mt-0">
            <div className="max-w-lg space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm">Timezone</Label>
                <Input
                  id="timezone"
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </TabsContent>

          {/* API Settings Tab */}
          <TabsContent value="api" className="p-6 mt-0">
            <div className="max-w-lg space-y-5">
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-sm">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={apiSettings.baseUrl}
                  onChange={(e) => setApiSettings({ ...apiSettings, baseUrl: e.target.value })}
                  className="h-10 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version" className="text-sm">API Version</Label>
                <Input
                  id="version"
                  value={apiSettings.version}
                  onChange={(e) => setApiSettings({ ...apiSettings, version: e.target.value })}
                  className="h-10 rounded-xl font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout" className="text-sm">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={apiSettings.timeout}
                    onChange={(e) => setApiSettings({ ...apiSettings, timeout: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries" className="text-sm">Retry Count</Label>
                  <Input
                    id="retries"
                    type="number"
                    value={apiSettings.retries}
                    onChange={(e) => setApiSettings({ ...apiSettings, retries: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Rate Limiting Tab */}
          <TabsContent value="ratelimit" className="p-6 mt-0">
            <div className="max-w-lg space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Enable Rate Limiting</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Protect your APIs from abuse</p>
                </div>
                <Switch
                  checked={rateLimit.enabled}
                  onCheckedChange={(v) => setRateLimit({ ...rateLimit, enabled: v })}
                />
              </div>
              {rateLimit.enabled && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="rpm" className="text-sm">Requests Per Minute</Label>
                    <Input
                      id="rpm"
                      type="number"
                      value={rateLimit.requestsPerMin}
                      onChange={(e) => setRateLimit({ ...rateLimit, requestsPerMin: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burst" className="text-sm">Burst Limit</Label>
                    <Input
                      id="burst"
                      type="number"
                      value={rateLimit.burstLimit}
                      onChange={(e) => setRateLimit({ ...rateLimit, burstLimit: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Maximum allowed in a short burst</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="p-6 mt-0">
            <div className="max-w-lg space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Enable Webhooks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Receive real-time event notifications</p>
                </div>
                <Switch
                  checked={webhooks.enabled}
                  onCheckedChange={(v) => setWebhooks({ ...webhooks, enabled: v })}
                />
              </div>
              {webhooks.enabled && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl" className="text-sm">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={webhooks.url}
                      onChange={(e) => setWebhooks({ ...webhooks, url: e.target.value })}
                      className="h-10 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Events</Label>
                    <div className="flex flex-wrap gap-2">
                      {["request.success", "request.failed", "quota.warning", "quota.exceeded", "key.rotated"].map((event) => (
                        <button
                          key={event}
                          onClick={() => {
                            const events = webhooks.events.includes(event)
                              ? webhooks.events.filter((e) => e !== event)
                              : [...webhooks.events, event];
                            setWebhooks({ ...webhooks, events });
                          }}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                            webhooks.events.includes(event)
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret" className="text-sm">Signing Secret</Label>
                    <Input
                      id="secret"
                      value={webhooks.secret}
                      onChange={(e) => setWebhooks({ ...webhooks, secret: e.target.value })}
                      className="h-10 rounded-xl font-mono"
                      type="password"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
