/**
 * SavingsGoalPanel Component
 * 
 * Standalone panel for setting and tracking savings goal target amount.
 * Displays visual progress, remaining amount, and goal achievement status.
 * Independent from auto-save configuration.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrencyStore, formatCurrency, getCurrencySymbol } from '@/stores/currencyStore';

interface SavingsGoalPanelProps {
  pocketId: number;
  currentBalance: number;
  goalAmount?: number;
  onSave: (goalAmount: number) => void;
}

export function SavingsGoalPanel({ currentBalance, goalAmount = 5000, onSave }: SavingsGoalPanelProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [editedGoal, setEditedGoal] = useState(String(goalAmount));
  const [isEditing, setIsEditing] = useState(false);

  // Sync with prop changes (e.g., after mutation or pocket switch)
  useEffect(() => {
    setEditedGoal(String(goalAmount));
    setIsEditing(false);
  }, [goalAmount]);

  // Calculate progress
  const goal = Number(editedGoal);
  const progressPercentage = Math.min((currentBalance / goal) * 100, 100);
  const remainingAmount = Math.max(goal - currentBalance, 0);
  const isGoalReached = currentBalance >= goal;

  const handleSave = () => {
    const newGoal = Number(editedGoal);
    if (newGoal >= 0) {
      onSave(newGoal);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedGoal(String(goalAmount));
    setIsEditing(false);
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Savings Goal Target
            </CardTitle>
            <CardDescription>
              Set your emergency fund target amount and track progress
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Amount Input */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Target Amount</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted-foreground">{getCurrencySymbol(selectedCurrency)}</span>
              <Input
                type="number"
                min="0"
                step="100"
                value={editedGoal}
                onChange={(e) => {
                  setEditedGoal(e.target.value);
                  setIsEditing(true);
                }}
                className="flex-1 text-xl font-bold"
                placeholder="5000"
              />
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Save
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Financial experts recommend 3-6 months of living expenses ({formatCurrency(9000, selectedCurrency)} - {formatCurrency(18000, selectedCurrency)} for students)
          </p>
        </div>

        {/* Progress Visualization */}
        <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-blue-700 font-medium mb-1">Current Saved</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(currentBalance, selectedCurrency)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium mb-1">Target Goal</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(goal, selectedCurrency)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium mb-1">Remaining</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(remainingAmount, selectedCurrency)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-blue-900">Progress to Goal</span>
              <span className="font-bold text-blue-600">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Achievement Status */}
          {isGoalReached ? (
            <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border border-green-300">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-900">🎉 Goal Achieved!</p>
                <p className="text-xs text-green-700">You've reached your emergency fund target. Great job!</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  Keep saving! {formatCurrency(remainingAmount, selectedCurrency)} to go
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  You're {progressPercentage.toFixed(0)}% of the way to your goal
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Goal Presets */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Quick Goal Presets</Label>
          <div className="grid grid-cols-4 gap-2">
            {[3000, 5000, 10000, 15000].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditedGoal(String(preset));
                  setIsEditing(true);
                }}
                className="text-xs"
              >
                ${preset.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
