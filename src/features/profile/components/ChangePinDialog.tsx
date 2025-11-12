import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChangePinDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePinDialog({ open, onClose, onSuccess }: ChangePinDialogProps) {
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your current password');
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (newPin === '1234') {
      setError('Please choose a PIN other than the default 1234');
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.changePin(password, newPin, confirmPin);
      
      toast({
        title: 'PIN Changed Successfully',
        description: 'Your security PIN has been updated.',
      });

      setPassword('');
      setNewPin('');
      setConfirmPin('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            Change Security PIN
          </DialogTitle>
          <DialogDescription>
            Enter your password and choose a new 4-digit PIN for secure transactions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Current Password *
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground">
                Required for security verification
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin">New PIN *</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  disabled={isSubmitting}
                  className="text-center text-xl tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN *</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  disabled={isSubmitting}
                  className="text-center text-xl tracking-widest"
                />
              </div>
            </div>

            {newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-900">PINs match!</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
            <p className="text-sm font-semibold text-blue-900">💡 PIN Security Tips</p>
            <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
              <li>Choose a PIN you'll remember but others can't guess</li>
              <li>Avoid obvious sequences (1234, 0000, 1111)</li>
              <li>Don't use your birthday or phone number</li>
              <li>Your PIN protects DarkDays Pocket and other sensitive operations</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !password || newPin.length !== 4 || confirmPin.length !== 4}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isSubmitting ? 'Changing PIN...' : 'Change PIN'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
