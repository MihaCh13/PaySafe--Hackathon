/**
 * DarkDaysCard Component
 * 
 * Purpose:
 *   Black card visualization for DarkDays Pocket with vault aesthetics.
 *   Emphasizes security and separation from main wallet.
 * 
 * Expected Functions:
 *   - Display balance in secure, vault-like card
 *   - Lock/unlock animations
 *   - Balance blur/hide toggle
 *   - Restricted access indicators
 *   - Deposit-only quick actions
 * 
 * Current Implementation Status:
 *   [DONE] Black card design with gradient
 *   [DONE] Lock icon with status indicator
 *   [DONE] Balance display
 *   [DONE] Auto-save percentage display
 *   [PENDING] Balance blur toggle
 *   [PENDING] Lock/unlock animations
 *   [PENDING] Emergency access button
 *   [PENDING] Withdrawal restrictions UI
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, ShieldCheck, Plus, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface DarkDaysCardProps {
  pocket: {
    id: number;
    name: string;
    balance: number;
    auto_save_percentage: number;
    is_locked: boolean;
    goal_amount?: number;
  };
  onDeposit?: () => void;
  onEmergencyAccess?: () => void;
}

export function DarkDaysCard({ pocket, onDeposit, onEmergencyAccess }: DarkDaysCardProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Calculate dynamic progress toward goal
  const goalAmount = pocket.goal_amount || 5000; // Default goal: $5000 emergency fund
  const progressPercentage = Math.min((pocket.balance / goalAmount) * 100, 100);
  const remainingAmount = Math.max(goalAmount - pocket.balance, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <CardContent className="p-6 relative">
          {/* Lock Icon Overlay */}
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{
                rotate: pocket.is_locked ? 0 : 45,
              }}
              transition={{ duration: 0.3 }}
            >
              <ShieldCheck className="h-8 w-8 text-amber-400 opacity-20" />
            </motion.div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <Lock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{pocket.name}</h3>
                <p className="text-xs text-gray-400">Secure Emergency Fund</p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Protected
            </Badge>
          </div>

          {/* Balance Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Secured Balance</p>
              <button
                onClick={() => setBalanceHidden(!balanceHidden)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {balanceHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <motion.div
              animate={{ filter: balanceHidden ? 'blur(8px)' : 'blur(0px)' }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-4xl font-bold text-white mb-1">
                {formatCurrency(pocket.balance, selectedCurrency)}
              </p>
            </motion.div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-400">{progressPercentage.toFixed(0)}% to goal</p>
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                Goal: {formatCurrency(goalAmount, selectedCurrency)} • Remaining: {formatCurrency(remainingAmount, selectedCurrency)}
              </p>
            </div>
          </div>

          {/* Auto-Save Info */}
          <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Auto-Save Active</p>
                <p className="text-sm font-semibold text-white">
                  {pocket.auto_save_percentage}% of income
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Next transfer</p>
                <p className="text-sm font-semibold text-amber-400">Dec 1, 2025</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onDeposit}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Deposit
            </Button>
            <Button
              onClick={onEmergencyAccess}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Emergency
            </Button>
          </div>

          {/* Security Notice */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              🔒 Multi-layer security active • For emergency use only
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
