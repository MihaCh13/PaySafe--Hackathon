/**
 * SecurityVerificationModal Component
 * 
 * Purpose:
 *   Multi-step security verification for DarkDays Pocket withdrawals.
 *   Implements PIN + password authentication with emergency confirmation.
 * 
 * Expected Functions:
 *   - Step 1: PIN entry (4-6 digits)
 *   - Step 2: Password re-authentication
 *   - Step 3: Emergency confirmation checkbox
 *   - Step 4: Cooling period notification (optional)
 *   - Progress indicator across steps
 * 
 * Current Implementation Status:
 *   [DONE] Multi-step dialog structure
 *   [DONE] PIN input UI
 *   [DONE] Password input UI
 *   [DONE] Emergency confirmation checkbox
 *   [DONE] Progress indicator
 *   [PENDING] Actual PIN/password verification
 *   [PENDING] Cooling period logic
 *   [PENDING] Backend integration
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Lock, Shield, Clock } from 'lucide-react';
import { useState } from 'react';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface SecurityVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: (data: { pin: string; password: string; confirmed: boolean }) => void;
  amount: number;
}

export function SecurityVerificationModal({
  open,
  onClose,
  onVerified,
  amount,
}: SecurityVerificationModalProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onVerified({ pin, password, confirmed: emergencyConfirmed });
      handleReset();
    }
  };

  const handleReset = () => {
    setStep(1);
    setPin('');
    setPassword('');
    setEmergencyConfirmed(false);
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return pin.length >= 4;
      case 2:
        return password.length >= 8;
      case 3:
        return emergencyConfirmed;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Emergency Withdrawal Verification
          </DialogTitle>
          <DialogDescription>
            Withdrawing {formatCurrency(amount, selectedCurrency)} from DarkDays Pocket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: PIN Entry */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Lock className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-900">
                  Enter your 4-digit security PIN
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">Security PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  This is the PIN you set up for secure operations
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Password Re-authentication */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-900">
                  Re-enter your account password
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Account Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your UniPay account password is required for security
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-900 font-semibold">
                  This fund is for emergencies only
                </p>
              </div>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Breaking your savings discipline should only happen in genuine emergencies:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Medical emergencies</li>
                  <li>Unexpected travel costs</li>
                  <li>Family crisis situations</li>
                  <li>Critical repairs or replacements</li>
                </ul>
              </div>
              <div className="flex items-start space-x-2 p-4 border-2 border-red-300 rounded-lg">
                <Checkbox
                  id="emergency-confirm"
                  checked={emergencyConfirmed}
                  onCheckedChange={(checked) => setEmergencyConfirmed(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="emergency-confirm" className="text-sm leading-tight cursor-pointer">
                  <span className="font-semibold text-red-700">I confirm</span> this withdrawal is for a genuine emergency, and I understand I'm breaking my savings discipline.
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Cooling Period (Optional) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    24-Hour Cooling Period (Optional)
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Skip for immediate emergency access
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Immediate withdrawal:</strong> Funds available now
                </p>
                <p className="text-sm text-gray-700">
                  <strong>24-hour delay:</strong> Reduces impulse withdrawals
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  For this demo, withdrawal is immediate. Cooling period feature will be added in production.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={!canProceed()}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            {step === totalSteps ? 'Confirm Withdrawal' : 'Next Step'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
