"use client";

import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";

export function GitHubConnect() {
  const { openExternalAuth } = useClerk();

  const handleConnect = () => {
    openExternalAuth({ provider: "github" });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Connect GitHub</h2>
      <Button onClick={handleConnect}>Connect GitHub Account</Button>
    </div>
  );
}
