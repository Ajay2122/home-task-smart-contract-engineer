"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Target, TrendingUp, Trophy } from "lucide-react";

interface StatsCardProps {
  reputation?: unknown;
  totalBets: number;
}

export function StatsCard({ reputation }: StatsCardProps) {
  if (!reputation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trading history yet</p>
        </CardContent>
      </Card>
    );
  }

  const [rep, total, correct, accuracy] = reputation as readonly [bigint, bigint, bigint, bigint];
  const reputationValue = Number(rep);
  const totalBetsValue = Number(total);
  const correctBetsValue = Number(correct);
  const accuracyValue = Number(accuracy);

  const getReputationLevel = (rep: number) => {
    if (rep >= 800) return { level: "Expert", color: "text-yellow-500", icon: Trophy };
    if (rep >= 600) return { level: "Advanced", color: "text-purple-500", icon: Award };
    if (rep >= 400) return { level: "Intermediate", color: "text-blue-500", icon: Target };
    if (rep >= 200) return { level: "Beginner", color: "text-green-500", icon: TrendingUp };
    return { level: "Novice", color: "text-gray-500", icon: Target };
  };

  const { level, color, icon: Icon } = getReputationLevel(reputationValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Your Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reputation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reputation</span>
            <Badge variant="secondary" className={color}>
              <Icon className="h-3 w-3 mr-1" />
              {level}
            </Badge>
          </div>
          <Progress value={(reputationValue / 1000) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {reputationValue} / 1,000 points
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Bets</p>
            <p className="text-2xl font-bold">{totalBetsValue}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Correct Bets</p>
            <p className="text-2xl font-bold text-green-500">{correctBetsValue}</p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accuracy</span>
            <span className="text-sm font-bold">{accuracyValue}%</span>
          </div>
          <Progress value={accuracyValue} className="h-2" />
        </div>

        {/* Performance Indicator */}
        {accuracyValue >= 70 && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              🎉 Excellent performance! Keep it up!
            </p>
          </div>
        )}
        {accuracyValue >= 50 && accuracyValue < 70 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              📈 Good work! You&apos;re above average.
            </p>
          </div>
        )}
        {accuracyValue < 50 && totalBetsValue > 0 && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              💪 Keep learning! Study the markets more.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
