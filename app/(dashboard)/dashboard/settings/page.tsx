import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerPortalAction } from "@/lib/payments/actions";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

async function getTeamData() {
  const user = await currentUser();
  return {
    planName: user?.publicMetadata?.planName || "Free",
    subscriptionStatus:
      user?.publicMetadata?.subscriptionStatus || "No active subscription",
  };
}

async function TeamSubscriptionContent() {
  const teamData = await getTeamData();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-4 sm:mb-0">
          <p className="font-medium">Current Plan: {teamData.planName}</p>
          <p className="text-sm text-muted-foreground">
            {teamData.subscriptionStatus === "active"
              ? "Billed monthly"
              : teamData.subscriptionStatus === "trialing"
              ? "Trial period"
              : "No active subscription"}
          </p>
        </div>
        <form action={customerPortalAction}>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center"
          >
            Manage Subscription
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading subscription details...</div>}>
          <TeamSubscriptionContent />
        </Suspense>
      </CardContent>
    </Card>
  );
}
