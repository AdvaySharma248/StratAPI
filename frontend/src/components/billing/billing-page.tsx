"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ArrowUpRight, Download, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  requestLimit: number | null;
  features: string[];
  billingCycle: string;
  isCustom: boolean;
}

interface Invoice {
  _id?: string;
  id?: string;
  periodStart?: string;
  amount: number;
  status: string;
}

interface BillingSummary {
  recentInvoices?: Invoice[];
  plans?: Plan[];
  subscription?: {
    status: string;
    currentPlan?: Plan | null;
    usage?: {
      requests: number;
      limit: number | null;
      unlimited: boolean;
    };
  };
}

interface SubscribeResponse {
  paymentRequired: boolean;
  razorpayKeyId?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
  };
  plan: Plan;
}

function formatPrice(plan: Plan) {
  if (plan.isCustom || plan.price === null) {
    return "Custom";
  }

  return `₹${plan.price}`;
}

function formatRequestLimit(limit: number | null) {
  if (limit === null) {
    return "Unlimited";
  }

  return limit.toLocaleString();
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message || body.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout is only available in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[src='https://checkout.razorpay.com/v1/checkout.js']");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay Checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });
}

export function BillingPage() {
  const { user } = useAuth();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  const plans = billingSummary?.plans ?? [];
  const currentPlan = billingSummary?.subscription?.currentPlan ?? plans.find((plan) => plan.slug === "free") ?? null;
  const usage = billingSummary?.subscription?.usage;
  const upgradePlans = useMemo(
    () => plans.filter((plan) => plan.id !== currentPlan?.id),
    [currentPlan?.id, plans]
  );
  const usagePercent =
    usage?.limit && usage.limit > 0 ? Math.min(Math.round((usage.requests / usage.limit) * 100), 100) : 0;
  const monthlyPrice = currentPlan?.price ?? 0;

  const loadBilling = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/billing/summary", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setBillingSummary((await response.json()) as BillingSummary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load billing plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const verifyPayment = async (payment: RazorpayPaymentResponse) => {
    const response = await fetch("/api/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
  };

  const subscribeToPlan = async (plan: Plan) => {
    if (plan.id === currentPlan?.id) {
      return;
    }

    if (plan.isCustom) {
      toast.info("Enterprise uses custom pricing. Contact support for activation.");
      return;
    }

    setUpgradingPlanId(plan.id);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          planId: plan.id,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const subscription = (await response.json()) as SubscribeResponse;

      if (!subscription.paymentRequired) {
        await loadBilling();
        setUpgradeDialogOpen(false);
        toast.success(`${subscription.plan.name} plan activated.`);
        return;
      }

      if (!subscription.razorpayKeyId || !subscription.order) {
        throw new Error("Payment order was not returned by the backend.");
      }

      await loadRazorpayCheckout();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout did not load.");
      }

      const checkout = new window.Razorpay({
        key: subscription.razorpayKeyId,
        amount: subscription.order.amount,
        currency: subscription.order.currency,
        name: "StratAPI",
        description: `${subscription.plan.name} subscription`,
        order_id: subscription.order.id,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#DC2626",
        },
        handler: async (payment: RazorpayPaymentResponse) => {
          try {
            await verifyPayment(payment);
            await loadBilling();
            setUpgradeDialogOpen(false);
            toast.success(`${subscription.plan.name} plan activated.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed.");
          } finally {
            setUpgradingPlanId(null);
          }
        },
      });

      checkout.on("payment.failed", () => {
        setUpgradingPlanId(null);
        toast.error("Payment failed. Please try again.");
      });
      checkout.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
      setUpgradingPlanId(null);
    }
  };

  const openUpgradeDialog = () => {
    if (!upgradePlans.length) {
      toast.info("You are already on the highest configured plan.");
      return;
    }

    setUpgradeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and view invoices</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-card p-6">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-primary" />
                <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 text-primary text-xs">
                  Current Plan
                </Badge>
              </div>
              <h2 className="mt-3 text-2xl font-bold">
                {loading ? "Loading..." : currentPlan?.name ?? "Free"}
                <span className="ml-2 text-lg font-normal text-muted-foreground">
                  {currentPlan ? `${formatPrice(currentPlan)}/mo` : "₹0/mo"}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {formatRequestLimit(currentPlan?.requestLimit ?? 1000)} API requests per month
              </p>
            </div>
            <Button
              className="bg-primary text-white rounded-xl hover:bg-primary/90 transition-opacity shrink-0"
              onClick={openUpgradeDialog}
              disabled={loading}
            >
              <Rocket size={16} className="mr-2" />
              Upgrade Plan
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(currentPlan?.features ?? ["Basic features"]).map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check size={14} className="text-primary shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Usage This Month</h3>
          <p className="text-sm text-muted-foreground mt-0.5">API request consumption</p>

          <div className="mt-6">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold tracking-tight">
                {(usage?.requests ?? 0).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {usage?.unlimited ? "Unlimited" : `of ${formatRequestLimit(usage?.limit ?? currentPlan?.requestLimit ?? 1000)}`}
              </span>
            </div>
            <Progress value={usage?.unlimited ? 0 : usagePercent} className="mt-3 h-2.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              {usage?.unlimited ? "Unlimited monthly quota" : `${usagePercent}% of monthly quota used`}
            </p>
          </div>

          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly subscription</span>
              <span className="text-lg font-semibold">{currentPlan?.isCustom ? "Custom" : `₹${monthlyPrice}`}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on your current plan and usage limit
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-semibold">Available Plans</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Choose the plan that fits your needs</p>

          <div className="mt-5 space-y-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 transition-colors",
                    isCurrent
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isCurrent ? "bg-primary text-white" : "bg-muted"
                    )}>
                      <Zap size={18} className={isCurrent ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{plan.name}</span>
                        {isCurrent && (
                          <Badge className="h-5 rounded-full bg-primary/10 text-primary border-0 text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRequestLimit(plan.requestLimit)} requests/mo
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatPrice(plan)}</span>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => subscribeToPlan(plan)}
                        disabled={upgradingPlanId === plan.id}
                      >
                        {upgradingPlanId === plan.id ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!loading && plans.length === 0 && (
              <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Unable to load plans right now.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-base font-semibold">Invoices</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Your billing history</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                {["Invoice", "Date", "Amount", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(billingSummary?.recentInvoices ?? []).map((invoice) => (
                <tr
                  key={invoice.id ?? invoice._id}
                  className="group border-t border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-medium font-mono">{invoice.id ?? invoice._id}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-muted-foreground">
                      {invoice.periodStart ? invoice.periodStart.split("T")[0] : "--"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm font-semibold">₹{invoice.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium border-0 bg-emerald-500/10 text-emerald-600"
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs text-muted-foreground">
                      <Download size={13} className="mr-1" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
              {(billingSummary?.recentInvoices ?? []).length === 0 && (
                <tr className="border-t border-border/50">
                  <td className="px-6 py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
            <DialogDescription>Choose a higher request tier for this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {upgradePlans.map((plan) => (
              <button
                key={plan.id}
                className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/30"
                onClick={() => subscribeToPlan(plan)}
                disabled={upgradingPlanId === plan.id}
              >
                <span>
                  <span className="block text-sm font-semibold">{plan.name}</span>
                  <span className="block text-xs text-muted-foreground">{formatRequestLimit(plan.requestLimit)} requests/mo</span>
                </span>
                <span className="flex items-center gap-2 text-lg font-bold">
                  {upgradingPlanId === plan.id && <Loader2 size={14} className="animate-spin" />}
                  {formatPrice(plan)}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
