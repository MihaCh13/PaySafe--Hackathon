import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Target } from 'lucide-react';
import { useState } from 'react';
import GoalProgressBar from './GoalProgressBar';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
}

interface TransferToGoalModalProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  walletBalance: number;
  onTransfer: (goalId: number, amount: number) => void;
}

export default function TransferToGoalModal({
  open,
  onClose,
  goal,
  walletBalance,
  onTransfer,
}: TransferToGoalModalProps) {
  const [amount, setAmount] = useState('');

  if (!goal) return null;

  const remaining = goal.target_amount - goal.current_amount;
  const presetAmounts = [10, 25, 50, 100].filter(amt => amt <= walletBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transferAmount = parseFloat(amount);
    if (transferAmount > 0 && transferAmount <= walletBalance) {
      onTransfer(goal.id, transferAmount);
      setAmount('');
      onClose();
    }
  };

  const amountError = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return 'Enter a valid amount';
    if (amt > walletBalance) return 'Insufficient wallet balance';
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{goal.icon}</span>
            Add Money to {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-violet-50 to-indigo-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Progress</span>
                <span className="font-semibold text-gray-900">
                  ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                </span>
              </div>
              <GoalProgressBar 
                current={goal.current_amount} 
                target={goal.target_amount}
                showPercentage={false}
              />
              <div className="text-sm text-gray-600">
                <Target className="h-4 w-4 inline mr-1" />
                ${remaining.toFixed(2)} remaining
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  <Wallet className="h-4 w-4 inline mr-1" />
                  Wallet Balance
                </span>
                <span className="font-bold text-lg text-gray-900">
                  ${walletBalance.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Transfer ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                max={walletBalance}
                required
              />
              {amount && amountError() && (
                <p className="text-sm text-red-600">{amountError()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="hover:bg-violet-50 hover:border-violet-300"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!amount || !!amountError()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                Transfer Now
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
