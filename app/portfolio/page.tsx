"use client";

import { useAccount } from "wagmi";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { useUserBetHistory, useClaimHistory } from "@/lib/hooks/useEventHistory";
import { PositionCard } from "@/components/portfolio/position-card";
import { BetHistoryItem } from "@/components/portfolio/bet-history-item";
import { StatsCard } from "@/components/portfolio/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Briefcase, History, TrendingUp, Trophy, ExternalLink, User } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { format } from "date-fns";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { betIds, betsData, reputation, isLoading } = usePortfolio();
  const { bets, isLoading: betsLoading } = useUserBetHistory(address);
  const { claims, isLoading: claimsLoading } = useClaimHistory(address);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div>
          <p className="text-muted-foreground">
            View your positions, history, and track your performance
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your wallet to view your positions, track your performance, and manage your bets.
            </p>
            <div className="flex justify-center pt-4">
              <ConnectButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || betsLoading || claimsLoading) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Filter positions to only show bets user currently owns
  // When a position is sold, userBets still contains the betId but bettor changes
  const ownedPositions = betIds?.filter((betId, index) => {
    const betResult = betsData?.[index];
    if (!betResult?.result) return false;

    // Parse bet data to get current bettor (index 1 in bet tuple)
    const betData = betResult.result as readonly [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean];
    const currentBettor = betData[1]; // bettor address

    // Only show if current user is the bettor
    return address && currentBettor.toLowerCase() === address.toLowerCase();
  }) || [];

  // Calculate win rate
  const winRate = bets.length > 0 ? Math.round((claims.length / bets.length) * 100) : 0;
  const totalWinnings = claims.reduce((sum, c) => sum + c.amount, BigInt(0));

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Your positions, transaction history, and performance stats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content with Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="positions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="positions" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Positions ({ownedPositions.length})
              </TabsTrigger>
              <TabsTrigger value="bets" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Bets ({bets.length})
              </TabsTrigger>
              <TabsTrigger value="claims" className="gap-2">
                <Trophy className="h-4 w-4" />
                Claims ({claims.length})
              </TabsTrigger>
            </TabsList>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-4">
              {ownedPositions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold">No Positions Yet</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You haven&apos;t placed any bets yet. Explore markets and make your first prediction!
                    </p>
                    <Link href="/markets">
                      <Button>Browse Markets</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                ownedPositions.map((betId) => {
                  const index = betIds?.indexOf(betId);
                  if (index === undefined || index === -1) return null;

                  const betResult = betsData?.[index];
                  if (!betResult?.result) return null;

                  return (
                    <PositionCard
                      key={betId}
                      betId={betId}
                      betData={betResult.result}
                    />
                  );
                })
              )}
            </TabsContent>

            {/* Bets History Tab */}
            <TabsContent value="bets">
              <Card>
                <CardHeader>
                  <CardTitle>All Bets</CardTitle>
                  <CardDescription>
                    Complete history of all bets you&apos;ve placed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bets.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Bets Yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start betting on markets to build your history
                      </p>
                      <Link href="/markets">
                        <Badge className="cursor-pointer">Browse Markets</Badge>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bets.map((bet) => (
                        <BetHistoryItem
                          key={bet.betId.toString()}
                          betId={bet.betId}
                          marketId={bet.marketId}
                          amount={bet.amount}
                          timestamp={bet.timestamp}
                          transactionHash={bet.transactionHash}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Claims History Tab */}
            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle>Claimed Winnings</CardTitle>
                  <CardDescription>
                    History of all winnings you&apos;ve successfully claimed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {claims.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Claims Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Win some bets and claim your rewards!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Win Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 rounded-lg bg-accent">
                          <div className="text-2xl font-bold text-primary">
                            {claims.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Claims
                          </div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-accent">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatEther(totalWinnings)} ETH
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Winnings
                          </div>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-accent">
                          <div className="text-2xl font-bold text-primary">
                            {winRate}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Win Rate
                          </div>
                        </div>
                      </div>

                      {/* Claims List */}
                      <div className="space-y-3">
                        {claims.map((claim) => (
                          <div
                            key={claim.betId.toString()}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                  Won
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Bet ID: {claim.betId.toString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  +{formatEther(claim.amount)} ETH
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  {format(claim.timestamp * 1000, "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`https://sepolia.etherscan.io/tx/${claim.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <StatsCard reputation={reputation} totalBets={ownedPositions.length} />

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/markets" className="block">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Browse Markets
                  </Button>
                </Link>
                <Link href="/marketplace" className="block">
                  <Button variant="outline" className="w-full">
                    <History className="h-4 w-4 mr-2" />
                    View Marketplace
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
