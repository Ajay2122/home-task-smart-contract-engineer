"use client";

import { CreateMarketFormDynamic } from "@/components/CreateMarketFormDynamic";
import { useAccount } from "wagmi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CreateMarketPage() {
  const { address } = useAccount();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Market</h1>
        <p className="text-muted-foreground">
          Create a new prediction market for users to bet on
        </p>
      </div>

      {!address && (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Wallet className="h-5 w-5" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>You need to connect your wallet to create a new market.</p>
            <ConnectButton />
          </AlertDescription>
        </Alert>
      )}

      <div className={`bg-card border rounded-lg p-6 ${!address ? "opacity-60 pointer-events-none" : ""}`}>
        <CreateMarketFormDynamic />
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Guidelines</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Questions should be clear and objectively resolvable</li>
          <li>Include specific criteria in the description</li>
          <li>Set a reasonable resolution date</li>
          <li>Choose a trusted arbitrator address</li>
          <li>Support for 2-10 outcomes (binary or multi-outcome markets)</li>
        </ul>
      </div>
    </div>
  );
}
