"use client";

import { useState, useEffect } from "react";
import { useResolveMarket } from "@/lib/hooks/useCreateMarket";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gavel, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

interface ResolveMarketDialogProps {
  marketId: number;
  outcomes: readonly string[];
  isArbitrator: boolean;
  isResolved: boolean;
  resolutionTime: bigint;
}

export function ResolveMarketDialog({
  marketId,
  outcomes,
  isArbitrator,
  isResolved,
  resolutionTime,
}: ResolveMarketDialogProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string>("0");
  const [open, setOpen] = useState(false);
  const { resolveMarket, isPending, isConfirming, isSuccess } =
    useResolveMarket();

  // Check if current time is past resolution time
  const currentTime = Math.floor(Date.now() / 1000);
  const canResolveNow = currentTime >= Number(resolutionTime);

  const handleResolve = () => {
    if (!isArbitrator) {
      toast.error("Only the arbitrator can resolve this market");
      return;
    }

    const outcomeIndex = parseInt(selectedOutcome);
    resolveMarket(marketId, outcomeIndex);
  };

  // Close dialog and show success message when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      setOpen(false);
      toast.success("Market resolved successfully!", {
        description: "All winning positions can now be claimed",
      });
    }
  }, [isSuccess]);

  if (!isArbitrator || isResolved) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full md:w-auto"
          disabled={!canResolveNow}
          title={!canResolveNow ? `Market can be resolved ${formatDistanceToNow(Number(resolutionTime) * 1000, { addSuffix: true })}` : ''}
        >
          <Gavel className="w-4 h-4 mr-2" />
          {canResolveNow ? 'Resolve Market' : 'Resolve Market (Not Yet)'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resolve Market</DialogTitle>
          <DialogDescription>
            Select the winning outcome for this market. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {!canResolveNow && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This market can be resolved {formatDistanceToNow(Number(resolutionTime) * 1000, { addSuffix: true })}.
              Please wait until the resolution time has passed.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <RadioGroup
            value={selectedOutcome}
            onValueChange={setSelectedOutcome}
            className="space-y-3"
          >
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`outcome-${index}`} />
                <Label
                  htmlFor={`outcome-${index}`}
                  className="text-base cursor-pointer flex-1"
                >
                  {outcome}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!canResolveNow || isPending || isConfirming}
          >
            {isPending || isConfirming
              ? "Resolving..."
              : !canResolveNow
              ? "Not Yet Available"
              : "Confirm Resolution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
