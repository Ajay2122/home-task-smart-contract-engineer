"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListPosition } from "@/lib/hooks/usePositionTrading";
import { toast } from "sonner";
import { zeroAddress } from "viem";

interface ListPositionDialogProps {
  betId: number;
  isOpen: boolean;
  onClose: () => void;
  tokenAddress?: string;
}

export function ListPositionDialog({ betId, isOpen, onClose, tokenAddress }: ListPositionDialogProps) {
  const { address } = useAccount();
  const [price, setPrice] = useState("");
  const { listPosition, isPending, isConfirming } = useListPosition();

  // Determine token symbol
  const isEthMarket = !tokenAddress || tokenAddress === zeroAddress;
  const tokenSymbol = isEthMarket ? "ETH" : "USDC";

  const handleList = () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    listPosition(betId, price);
    toast.success("Listing position for sale...");
    setPrice("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>List Position for Sale</DialogTitle>
          <DialogDescription>
            Set a price for your position. Other users can buy it from you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">Sale Price ({tokenSymbol})</Label>
            <Input
              id="price"
              type="number"
              step={isEthMarket ? "0.0001" : "0.01"}
              placeholder={isEthMarket ? "0.01" : "10"}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The buyer will pay this amount in {tokenSymbol} to purchase your position
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleList} disabled={!address || isPending || isConfirming || !price}>
            {!address
              ? "Connect Wallet"
              : isPending || isConfirming
              ? "Listing..."
              : "List Position"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
