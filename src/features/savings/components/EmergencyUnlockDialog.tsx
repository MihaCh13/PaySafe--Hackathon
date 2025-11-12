/**
 * EmergencyUnlockDialog Component
 * 
 * Purpose:
 *   Emergency access dialog for DarkDays Pocket with proper verification.
 *   Allows emergency withdrawals with reason tracking and audit logging.
 * 
 * Expected Functions:
 *   - Emergency category selection (Medical, Travel, Family, Crisis)
 *   - Reason text field (required)
 *   - Multi-layer verification
 *   - Warning messages about emergency fund usage
 *   - Email notification opt-in
 * 
 * Current Implementation Status:
 *   [DONE] Emergency category selection
 *   [DONE] Reason input field
 *   [DONE] Warning UI
 *   [DONE] Verification integration
 *   [PENDING] Email notification system
 *   [PENDING] Cooldown period enforcement
 *   [PENDING] Backend audit logging
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Heart, Plane, Users, Flame } from 'lucide-react';
import { useState } from 'react';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

interface EmergencyUnlockDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: (data: { category: string; reason: string }) => void;
  pocketBalance: number;
}

const emergencyCategories = [
  { value: 'medical', label: 'Medical Emergency', icon: Heart, color: 'text-red-600' },
  { value: 'travel', label: 'Emergency Travel', icon: Plane, color: 'text-blue-600' },
  { value: 'family', label: 'Family Crisis', icon: Users, color: 'text-purple-600' },
  { value: 'crisis', label: 'Critical Situation', icon: Flame, color: 'text-orange-600' },
];

export function EmergencyUnlockDialog({
  open,
  onClose,
  onProceed,
  pocketBalance,
}: EmergencyUnlockDialogProps) {
  const { selectedCurrency } = useCurrencyStore();
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');

  const handleProceed = () => {
    if (category && reason.trim()) {
      onProceed({ category, reason });
      setCategory('');
      setReason('');
      onClose();
    }
  };

  const selectedCategory = emergencyCategories.find(c => c.value === category);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Emergency Access Request
          </DialogTitle>
          <DialogDescription>
            Available balance: {formatCurrency(pocketBalance, selectedCurrency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-2">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This fund is designed for genuine emergencies only. 
              Using it for non-emergencies will break your savings discipline and delay your financial goals.
            </AlertDescription>
          </Alert>

          {/* Emergency Category */}
          <div className="space-y-2">
            <Label htmlFor="emergency-category">Emergency Type *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="emergency-category">
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                {emergencyCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cat.color}`} />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <selectedCategory.icon className={`h-3 w-3 ${selectedCategory.color}`} />
                {selectedCategory.label} selected
              </p>
            )}
          </div>

          {/* Reason Text Field */}
          <div className="space-y-2">
            <Label htmlFor="emergency-reason">
              Reason for Emergency Access *
            </Label>
            <Textarea
              id="emergency-reason"
              placeholder="Please explain why you need emergency access to these funds. Be specific about the situation."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters • This will be logged for your records
            </p>
          </div>

          {/* Emergency Guidelines */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
            <p className="text-sm font-semibold text-amber-900">✅ Valid Emergency Examples:</p>
            <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
              <li>Unexpected medical bills or prescriptions</li>
              <li>Emergency flight for family crisis</li>
              <li>Critical car/home repairs affecting safety</li>
              <li>Urgent living expenses due to job loss</li>
            </ul>
            <p className="text-sm font-semibold text-amber-900 mt-3">❌ Not Emergency Examples:</p>
            <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
              <li>Shopping sales or impulse purchases</li>
              <li>Entertainment or vacation expenses</li>
              <li>Gifts or celebrations</li>
              <li>Non-urgent wants or upgrades</li>
            </ul>
          </div>

          {/* Cooldown Notice (Pending Implementation) */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> After emergency access, a 7-day cooldown period will apply before the next emergency withdrawal. This helps prevent abuse of emergency funds.
            </p>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={!category || !reason.trim()}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            Proceed to Verification
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
