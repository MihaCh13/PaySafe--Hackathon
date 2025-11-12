/**
 * AutoSaveConfigPanel Component
 * 
 * Purpose:
 *   Configure automatic savings settings for DarkDays Pocket.
 *   Allows users to set percentage, frequency, and schedule for auto-transfers.
 * 
 * Expected Functions:
 *   - Enable/disable auto-save toggle
 *   - Percentage slider (5% - 50%)
 *   - Frequency selection (weekly, monthly, fixed date)
 *   - Date picker for fixed dates
 *   - Preview of next transfer amount and date
 * 
 * Current Implementation Status:
 *   [DONE] Enable/disable toggle
 *   [DONE] Percentage slider with live preview
 *   [DONE] Frequency dropdown
 *   [DONE] Date picker for fixed dates
 *   [DONE] Transfer preview calculation
 *   [PENDING] Backend integration
 *   [PENDING] Save configuration API call
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Calendar, Info } from 'lucide-react';
import { useState } from 'react';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface AutoSaveConfigPanelProps {
  currentConfig?: {
    enabled: boolean;
    percentage: number;
    frequency: string;
    next_date?: string;
  };
  onSave: (config: any) => void;
}

export function AutoSaveConfigPanel({ currentConfig, onSave }: AutoSaveConfigPanelProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [enabled, setEnabled] = useState(currentConfig?.enabled ?? true);
  const [percentage, setPercentage] = useState([currentConfig?.percentage ?? 20]);
  const [frequency, setFrequency] = useState(currentConfig?.frequency ?? 'monthly');
  const [fixedDate, setFixedDate] = useState('');

  // Using realistic placeholder income (students typically earn $1500-2500/month)
  // TODO: Replace with actual user income data from profile/transactions
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
    onSave({
      enabled,
      percentage: percentage[0],
      frequency,
      next_date: fixedDate || null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-600" />
              Auto-Save Configuration
            </CardTitle>
            <CardDescription>
              Automatically transfer a percentage of income to DarkDays Pocket
            </CardDescription>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'} className={enabled ? 'bg-green-500' : ''}>
            {enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Percentage Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Savings Percentage</Label>
                <span className="text-2xl font-bold text-violet-600">{percentage[0]}%</span>
              </div>
              <Slider
                value={percentage}
                onValueChange={setPercentage}
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
              <Select value={frequency} onValueChange={setFrequency}>
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
                  onChange={(e) => setFixedDate(e.target.value)}
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

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              Save Configuration
            </Button>
          </>
        )}

        {!enabled && (
          <div className="p-8 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Enable auto-save to configure automatic transfers</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
