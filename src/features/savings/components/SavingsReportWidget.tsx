/**
 * SavingsReportWidget Component
 * 
 * Purpose:
 *   Display savings progress reports and statistics for DarkDays Pocket.
 *   Provides motivational insights and savings milestones.
 * 
 * Expected Functions:
 *   - Display "Saved X in last Y months"
 *   - Monthly/yearly savings chart
 *   - Savings streak counter
 *   - Milestone badges (First $100, $500, $1000, etc.)
 *   - Email/push notification reports
 *   - Export savings history (PDF/CSV)
 * 
 * Current Implementation Status:
 *   [DONE] Savings summary display
 *   [DONE] Milestone badges UI
 *   [DONE] Streak counter
 *   [DONE] Monthly savings total
 *   [PENDING] Chart visualization
 *   [PENDING] Export functionality
 *   [PENDING] Email report scheduling
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Flame, Download, Calendar } from 'lucide-react';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface SavingsReportWidgetProps {
  pocketId: number;
  totalSaved: number;
  monthsSaving: number;
  currentStreak: number;
  milestones?: number[];
}

export function SavingsReportWidget({
  pocketId,
  totalSaved,
  monthsSaving,
  currentStreak,
  milestones = [100, 500, 1000, 2000, 5000],
}: SavingsReportWidgetProps) {
  const { selectedCurrency } = useCurrencyStore();
  const monthlySavingsRate = monthsSaving > 0 ? totalSaved / monthsSaving : 0;
  const completedMilestones = milestones.filter(m => totalSaved >= m);
  const nextMilestone = milestones.find(m => totalSaved < m) || milestones[milestones.length - 1];
  const progressToNext = ((totalSaved / nextMilestone) * 100).toFixed(0);

  const getMilestoneIcon = (amount: number) => {
    if (amount >= 5000) return '🏆';
    if (amount >= 2000) return '💎';
    if (amount >= 1000) return '⭐';
    if (amount >= 500) return '🎯';
    return '🎉';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Savings Report
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Savings Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs font-semibold text-green-900">Total Saved</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSaved, selectedCurrency)}</p>
            <p className="text-xs text-green-700 mt-1">
              {formatCurrency(monthlySavingsRate, selectedCurrency)}/month average
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-900">Current Streak</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{currentStreak} days</p>
            <p className="text-xs text-amber-700 mt-1">
              {monthsSaving}-month commitment
            </p>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-600" />
              Next Milestone: {formatCurrency(nextMilestone, selectedCurrency)}
            </p>
            <span className="text-sm text-muted-foreground">{progressToNext}%</span>
          </div>
          <Progress value={Number(progressToNext)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatCurrency(nextMilestone - totalSaved, selectedCurrency)} away from your next achievement
          </p>
        </div>

        {/* Unlocked Milestones */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">🏆 Milestones Unlocked</p>
          <div className="grid grid-cols-3 gap-2">
            {milestones.map((milestone) => {
              const isUnlocked = totalSaved >= milestone;
              return (
                <div
                  key={milestone}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isUnlocked
                      ? 'bg-violet-50 border-violet-300 shadow-sm'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {isUnlocked ? getMilestoneIcon(milestone) : '🔒'}
                  </div>
                  <p className={`text-xs font-semibold ${isUnlocked ? 'text-violet-900' : 'text-gray-500'}`}>
                    {formatCurrency(milestone, selectedCurrency)}
                  </p>
                  {isUnlocked && (
                    <Badge variant="secondary" className="mt-1.5 text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 leading-tight">
                      Unlocked
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Insights */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
          <p className="text-sm font-semibold text-blue-900">💡 Savings Insights</p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
            <li>You've been saving for <strong>{monthsSaving} months</strong></li>
            <li>Current streak: <strong>{currentStreak} days</strong> without withdrawal</li>
            <li>Average monthly savings: <strong>{formatCurrency(monthlySavingsRate, selectedCurrency)}</strong></li>
            <li><strong>{completedMilestones.length}/{milestones.length}</strong> milestones achieved</li>
          </ul>
        </div>

        {/* Monthly Report Preview (Pending Chart Implementation) */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-gray-600" />
            <p className="text-sm font-semibold">Monthly Savings Trend</p>
          </div>
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            📊 Chart visualization coming soon
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Track your savings progress over time
          </p>
        </div>

        {/* Export Options (Pending Implementation) */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Export & Sharing</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Download className="h-3 w-3" />
              PDF Report
            </Button>
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Download className="h-3 w-3" />
              CSV Export
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export functionality will be available soon
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
