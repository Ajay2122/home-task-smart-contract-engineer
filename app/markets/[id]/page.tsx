"use client";

import { use } from "react";
import { useMarket, useTotalPool, useMarketTokenAddress, useMarketPools } from "@/lib/hooks/useMarkets";
import { usePlaceBet, useApproveERC20, useERC20Allowance, useERC20Balance } from "@/lib/hooks/useBet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeRemaining, formatDate } from "@/lib/utils/format";
import { Clock, TrendingUp, Users, Wallet, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ResolveMarketDialog } from "@/components/ResolveMarketDialog";
import { useAccount } from "wagmi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMarketBetHistory } from "@/lib/hooks/useEventHistory";
import { parseEther, formatEther } from "viem";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";


export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const marketId = parseInt(id);
  const { address } = useAccount();

  const { data: market, isLoading } = useMarket(marketId);
  const { data: totalPool } = useTotalPool(marketId);
  const { data: tokenAddress } = useMarketTokenAddress(marketId);
  const { placeBet, isPending, isConfirming } = usePlaceBet();
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveERC20();

  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");

  // Check if this is an ERC20 market
  const isERC20Market = tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000";

  // Format volume/pool based on token type
  const formatVolume = (value: bigint) => {
    if (isERC20Market) {
      return `${parseFloat(formatEther(value)).toFixed(2)} USDC`;
    } else {
      return `${parseFloat(formatEther(value)).toFixed(4)} ETH`;
    }
  };

  // Get ERC20 data if it's a token market
  const { data: allowance, refetch: refetchAllowance } = useERC20Allowance(
    isERC20Market ? tokenAddress : undefined,
    address
  );
  const { data: tokenBalance } = useERC20Balance(
    isERC20Market ? tokenAddress : undefined,
    address
  );

  // Check if user has approved enough tokens
  const betAmountWei = betAmount ? parseEther(betAmount) : BigInt(0);
  const hasEnoughAllowance = allowance ? (allowance as bigint) >= betAmountWei : false;
  const needsApproval = isERC20Market && betAmount && !hasEnoughAllowance;

  // Refetch allowance after approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      toast.success("Token approval successful! You can now place your bet.");
    }
  }, [isApproveSuccess, refetchAllowance]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!market || !Array.isArray(market)) {
    return (
      <div className="container py-8 text-center">
        <p>Market not found</p>
      </div>
    );
  }

  // Market tuple includes tokenAddress at index 10 (from getMarket function)
  const marketData = market as unknown as readonly [bigint, string, string, readonly string[], bigint, string, string, number, bigint];
  const [mId, question, description, outcomes, resolutionTime, arbitrator, creator, status, totalVolume] = marketData;

  const isArbitrator = address?.toLowerCase() === arbitrator.toLowerCase();
  const isResolved = status === 2;

  // Fetch token address from full market struct using useReadContract
  // Note: getMarket doesn't return tokenAddress, so we'll use the market mapping directly

  const getStatusBadge = () => {
    switch (status) {
      case 0: return <Badge variant="default">Open</Badge>;
      case 1: return <Badge variant="secondary">Closed</Badge>;
      case 2: return <Badge variant="outline">Resolved</Badge>;
      case 3: return <Badge variant="destructive">Cancelled</Badge>;
      default: return null;
    }
  };

  const handleApprove = () => {
    if (!tokenAddress || !betAmount) {
      toast.error("Invalid token or amount");
      return;
    }
    approve(tokenAddress as `0x${string}`, betAmount);
    toast.info("Approving tokens...");
  };

  const handlePlaceBet = () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (selectedOutcome === null || !betAmount) {
      toast.error("Please select an outcome and enter bet amount");
      return;
    }

    if (needsApproval) {
      toast.error("Please approve tokens first");
      return;
    }

    placeBet(marketId, selectedOutcome, betAmount, tokenAddress as `0x${string}` | undefined);
    toast.success("Placing bet...");
    setBetAmount("");
    setSelectedOutcome(null);
  };

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      {/* Wallet Connection Alert for Unconnected Users */}
      {!address && (
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Wallet className="h-5 w-5" />
          <AlertTitle>Connect Your Wallet to Participate</AlertTitle>
          <AlertDescription>
            You can browse markets and view information, but you&apos;ll need to connect your wallet to place bets or create markets.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{question}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Resolve Market Button - Only for arbitrator */}
        {isArbitrator && !isResolved && (
          <div className="mb-4">
            <ResolveMarketDialog
              marketId={marketId}
              outcomes={outcomes}
              isArbitrator={isArbitrator}
              isResolved={isResolved}
              resolutionTime={resolutionTime}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Ends: {formatDate(Number(resolutionTime))}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Volume: {formatVolume(totalVolume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Pool: {totalPool ? formatVolume(totalPool as bigint) : (isERC20Market ? "0.00 USDC" : "0.0000 ETH")}</span>
          </div>
        </div>
      </div>

      {/* Trading Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Odds & Betting
          </CardTitle>
          <CardDescription>
            Current probabilities and place your bets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Market Odds */}
          <OddsDisplay
            marketId={marketId}
            outcomes={outcomes}
            totalVolume={totalVolume}
            isEthMarket={!isERC20Market}
          />

          {/* Betting Interface */}
          <div className={`space-y-4 ${!address ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Place Your Bet</h3>
              {!address && (
                <Badge variant="secondary" className="text-xs">
                  Wallet Required
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outcomes.map((outcome: string, idx: number) => (
                <OutcomeCard
                  key={idx}
                  outcome={outcome}
                  index={idx}
                  marketId={marketId}
                  isSelected={selectedOutcome === idx}
                  onSelect={() => setSelectedOutcome(idx)}
                  disabled={!address}
                  totalVolume={totalVolume}
                  outcomeCount={outcomes.length}
                />
              ))}
            </div>

            {selectedOutcome !== null && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium">
                    Bet Amount ({isERC20Market ? "USDC" : "ETH"})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={isERC20Market ? "100" : "0.1"}
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="mt-1"
                  />
                  {isERC20Market && tokenBalance !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: {formatEther(tokenBalance as bigint)} USDC
                    </p>
                  )}
                </div>

                {/* ERC20 Approval Alert */}
                {isERC20Market && betAmount && (
                  <Alert variant={hasEnoughAllowance ? "default" : "destructive"}>
                    {hasEnoughAllowance ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Token Approval: Ready</AlertTitle>
                        <AlertDescription>
                          You have approved enough USDC. You can place your bet!
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>USDC Approval Required</AlertTitle>
                        <AlertDescription>
                          You need to approve the contract to spend your USDC before betting.
                          <br />
                          <span className="text-xs">
                            Current allowance: {allowance ? formatEther(allowance as bigint) : "0"} USDC
                          </span>
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}

                {/* Approval Button for ERC20 */}
                {needsApproval && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={handleApprove}
                    disabled={isApproving || isApprovingConfirming}
                  >
                    {isApproving || isApprovingConfirming
                      ? "Approving USDC..."
                      : "Approve USDC"}
                  </Button>
                )}

                {/* Place Bet Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handlePlaceBet}
                  disabled={
                    !address ||
                    isPending ||
                    isConfirming ||
                    !betAmount ||
                    !!needsApproval
                  }
                >
                  {!address
                    ? "Connect Wallet to Bet"
                    : needsApproval
                    ? `Approve ${isERC20Market ? "USDC" : "ETH"} First`
                    : isPending || isConfirming
                    ? "Placing Bet..."
                    : `Place Bet with ${isERC20Market ? "USDC" : "ETH"}`}
                </Button>
              </div>
            )}

            {!address && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                Connect your wallet above to place bets
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Market Information</CardTitle>
          <CardDescription>
            Market details and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Market ID</span>
              <span className="font-mono">#{Number(mId)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Currency</span>
              <Badge variant="outline">{isERC20Market ? "USDC" : "ETH"}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Resolution Time</span>
              <span>{formatTimeRemaining(Number(resolutionTime))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span>{["Open", "Closed", "Resolved", "Cancelled"][status]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Creator</span>
              <span className="font-mono text-xs">{creator.slice(0, 10)}...</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <RecentActivity marketId={marketId} maxItems={8} isEthMarket={!isERC20Market} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivity({ marketId, maxItems = 8, isEthMarket }: { marketId: number; maxItems?: number; isEthMarket: boolean }) {
  const { bets, isLoading, error } = useMarketBetHistory(marketId);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Unable to load activity feed
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const recentBets = bets.slice(0, maxItems);

  if (recentBets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No bets placed yet</p>
        <p className="text-xs mt-1">Be the first to bet on this market!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentBets.map((bet) => (
        <div
          key={bet.betId.toString()}
          className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium truncate font-mono">
                {bet.bettor.slice(0, 6)}...{bet.bettor.slice(-4)}
              </span>
              <span className="text-xs text-muted-foreground">
                placed a bet
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">
                {formatEther(bet.amount)} {isEthMarket ? "ETH" : "USDC"}
              </span>
              <span>•</span>
              <span>
                {formatDistanceToNow(bet.timestamp * 1000, {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <Link
            href={`https://sepolia.etherscan.io/tx/${bet.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </div>
      ))}
    </div>
  );
}

function OddsDisplay({
  marketId,
  outcomes,
  totalVolume,
  isEthMarket,
}: {
  marketId: number;
  outcomes: readonly string[];
  totalVolume: bigint;
  isEthMarket: boolean;
}) {
  const { pools } = useMarketPools(marketId, outcomes.length);

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <div>
      <h3 className="font-semibold mb-4">Current Odds</h3>
      {totalVolume === BigInt(0) ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
          <p className="font-medium">No bets placed yet</p>
          <p className="text-sm mt-1">Be the first to bet on this market!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {outcomes.map((outcome, idx) => {
            const pool = pools?.[idx] || BigInt(0);
            const probability = totalVolume > BigInt(0)
              ? Number((pool * BigInt(10000)) / totalVolume) / 100
              : 0;
            const color = COLORS[idx % COLORS.length];

            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-sm">{outcome}</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color }}>
                    {probability.toFixed(1)}%
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${probability}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Pool: {parseFloat(formatEther(pool)).toFixed(4)} {isEthMarket ? "ETH" : "USDC"}
                </div>
              </div>
            );
          })}
          <div className="pt-4 border-t flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Volume</span>
            <span className="font-semibold">
              {parseFloat(formatEther(totalVolume)).toFixed(4)} {isEthMarket ? "ETH" : "USDC"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomeCard({
  outcome,
  index,
  marketId,
  isSelected,
  onSelect,
  disabled = false,
  totalVolume,
  outcomeCount,
}: {
  outcome: string;
  index: number;
  marketId: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  totalVolume: bigint;
  outcomeCount: number;
}) {
  const { pools } = useMarketPools(marketId, outcomeCount);

  // Calculate probability based on actual pool data
  const pool = pools?.[index] || BigInt(0);
  const probability = totalVolume > BigInt(0)
    ? Number((pool * BigInt(10000)) / totalVolume) / 100
    : 0;

  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`p-4 border rounded-lg text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-primary/50 cursor-pointer"
      }`}
    >
      <div className="font-semibold mb-2">{outcome}</div>
      <div className="text-2xl font-bold text-primary">{probability.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground mt-1">Current probability</div>
    </button>
  );
}
