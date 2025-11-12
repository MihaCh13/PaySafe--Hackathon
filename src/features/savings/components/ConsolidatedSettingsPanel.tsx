/**
 * ConsolidatedSettingsPanel Component
 * 
 * Purpose:
 *   Unified settings interface for DarkDays Pocket combining:
 *   1. Savings Goal - Target amount and progress tracking
 *   2. Auto-Save Configuration - Automatic transfer settings
 *   
 * Features:
 *   - Single interface with two sections
 *   - One Save button to update all settings
 *   - Enable/disable auto-save completely
 *   - Clear and intuitive layout
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, TrendingUp, CheckCircle2, Zap, Calendar, Info, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrencyStore, formatCurrency, getCurrencySymbol } from '@/stores/currencyStore';
import { toast } from 'sonner';

interface ConsolidatedSettingsPanelProps {
  currentBalance: number;
  goalAmount?: number;
  currentConfig?: {
    enabled: boolean;
    percentage: number;
    frequency: string;
    next_date?: string;
  };
  onSave: (settings: {
    goal_amount: number;
    auto_save_config: {
      enabled: boolean;
      percentage: number;
      frequency: string;
      next_date?: string;
    };
  }) => void;
}

export function ConsolidatedSettingsPanel({
  currentBalance,
  goalAmount = 5000,
  currentConfig,
  onSave,
}: ConsolidatedSettingsPanelProps) {
  const { selectedCurrency } = useCurrencyStore();

  // Section 1: Savings Goal
  const [editedGoal, setEditedGoal] = useState(String(goalAmount));

  // Section 2: Auto-Save Configuration
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(currentConfig?.enabled ?? false);
  const [percentage, setPercentage] = useState([currentConfig?.percentage ?? 20]);
  const [frequency, setFrequency] = useState(currentConfig?.frequency ?? 'monthly');
  const [fixedDate, setFixedDate] = useState(currentConfig?.next_date || '');

  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setEditedGoal(String(goalAmount));
    setAutoSaveEnabled(currentConfig?.enabled ?? false);
    setPercentage([currentConfig?.percentage ?? 20]);
    setFrequency(currentConfig?.frequency ?? 'monthly');
    setFixedDate(currentConfig?.next_date || '');
    setHasChanges(false);
  }, [goalAmount, currentConfig]);

  // Calculate progress for goal section
  const goal = Number(editedGoal);
  const progressPercentage = Math.min((currentBalance / goal) * 100, 100);
  const remainingAmount = Math.max(goal - currentBalance, 0);
  const isGoalReached = currentBalance >= goal;

  // Calculate estimates for auto-save section
  const estimatedMonthlyIncome = 2000;
  const estimatedSavings = (estimatedMonthlyIncome * percentage[0]) / 100;

  const getNextTransferDate = () => {
    const today = new Date();
    switch (frequency) {
      case 'weekly':
        today.setDate(today.getDate() + 7);
        return today.toLocaleDateString();
      case 'monthly':
        today.setMonth(today.getMonth() + 1);
        return today.toLocaleDateString();
      case 'fixed_date':
        return fixedDate || 'Not set';
      default:
        return 'Not scheduled';
    }
  };

  const handleSave = () => {
    const goalValue = Number(editedGoal);
    
    // Validate goal amount
    if (isNaN(goalValue) || goalValue < 0) {
      toast.error('Please enter a valid goal amount (must be 0 or greater)');
      return;
    }

    onSave({
      goal_amount: goalValue,
      auto_save_config: {
        enabled: autoSaveEnabled,
        percentage: percentage[0],
        frequency,
        next_date: fixedDate || undefined,
      },
    });
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setEditedGoal(String(goalAmount));
    setAutoSaveEnabled(currentConfig?.enabled ?? false);
    setPercentage([currentConfig?.percentage ?? 20]);
    setFrequency(currentConfig?.frequency ?? 'monthly');
    setFixedDate(currentConfig?.next_date || '');
    setHasChanges(false);
  };

  const markChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SettingsIcon className="h-6 w-6 text-indigo-600" />
              DarkDays Pocket Settings
            </CardTitle>
            <CardDescription>
              Configure your savings goal and automatic transfer settings
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge variant="default" className="bg-amber-500">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ===== SECTION 1: SAVINGS GOAL ===== */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">1️⃣ Savings Goal Target</h3>
              <p className="text-sm text-muted-foreground">Set your emergency fund target amount</p>
            </div>
          </div>

          {/* Goal Amount Input */}
          <div className="space-y-3 ml-13">
            <Label className="text-base font-semibold">Target Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{getCurrencySymbol(selectedCurrency)}</span>
              <Input
                type="number"
                min="0"
                step="100"
                value={editedGoal}
                onChange={(e) => {
                  setEditedGoal(e.target.value);
                  markChanged();
                }}
                className="flex-1 text-xl font-bold"
                placeholder="5000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Financial experts recommend 3-6 months of living expenses ({formatCurrency(9000, selectedCurrency)} - {formatCurrency(18000, selectedCurrency)})
            </p>

            {/* Quick Goal Presets */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[3000, 5000, 10000, 15000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditedGoal(String(preset));
                    markChanged();
                  }}
                  className="text-xs"
                >
                  ${preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 ml-13">
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
                  <p className="text-xs text-green-700">You've reached your emergency fund target!</p>
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
        </div>

        <Separator className="my-8" />

        {/* ===== SECTION 2: AUTO-SAVE CONFIGURATION ===== */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">2️⃣ Auto-Save Configuration</h3>
              <p className="text-sm text-muted-foreground">Automatically transfer a percentage of income</p>
            </div>
            <Badge variant={autoSaveEnabled ? 'default' : 'secondary'} className={autoSaveEnabled ? 'bg-green-500' : ''}>
              {autoSaveEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg ml-13">
            <div className="flex-1">
              <Label htmlFor="auto-save-toggle" className="text-base font-semibold">
                Enable Auto-Save
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically save a portion of your income
              </p>
            </div>
            <Switch
              id="auto-save-toggle"
              checked={autoSaveEnabled}
              onCheckedChange={(checked) => {
                setAutoSaveEnabled(checked);
                markChanged();
              }}
            />
          </div>

          {autoSaveEnabled && (
            <div className="space-y-6 ml-13">
              {/* Percentage Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Savings Percentage</Label>
                  <span className="text-2xl font-bold text-violet-600">{percentage[0]}%</span>
                </div>
                <Slider
                  value={percentage}
                  onValueChange={(val) => {
                    setPercentage(val);
                    markChanged();
                  }}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5% (Conservative)</span>
                  <span>25% (Balanced)</span>
                  <span>50% (Aggressive)</span>
                </div>

                {/* Preview */}
                <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-violet-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-violet-900">
                        Estimated monthly savings: ${estimatedSavings.toFixed(2)}
                      </p>
                      <p className="text-xs text-violet-700 mt-1">
                        Based on estimated income of ${estimatedMonthlyIncome}/month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Transfer Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(val) => {
                    setFrequency(val);
                    markChanged();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Weekly (Every Monday)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Monthly (1st of month)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed_date">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Fixed Date (Choose below)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fixed Date Picker */}
              {frequency === 'fixed_date' && (
                <div className="space-y-2">
                  <Label htmlFor="fixed-date">Fixed Transfer Date</Label>
                  <Input
                    id="fixed-date"
                    type="date"
                    value={fixedDate}
                    onChange={(e) => {
                      setFixedDate(e.target.value);
                      markChanged();
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {/* Next Transfer Preview */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-900">Next Auto-Transfer</p>
                    <p className="text-xs text-green-700 mt-1">{getNextTransferDate()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(estimatedSavings, selectedCurrency)}
                    </p>
                    <p className="text-xs text-green-700">Estimated</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!autoSaveEnabled && (
            <div className="p-8 text-center text-muted-foreground ml-13">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Enable auto-save to configure automatic transfers</p>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* ===== SINGLE SAVE BUTTON ===== */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {hasChanges ? '⚠️ You have unsaved changes' : '✓ All settings saved'}
          </p>
          <div className="flex gap-3">
            {hasChanges && (
              <Button
                onClick={handleDiscard}
                variant="outline"
                size="lg"
                className="min-w-[150px]"
              >
                Discard Changes
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 min-w-[200px]"
            >
              Save All Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
