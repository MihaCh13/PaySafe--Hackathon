import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, QrCode, Users } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import QRCodeDisplay from './QRCodeDisplay';

interface LoanRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (requestData: any) => void;
}

const baseLoanRequestSchema = z.object({
  amount: z.number()
    .min(5, 'Minimum loan amount is $5')
    .max(500, 'Maximum loan amount is $500'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters'),
  deadline: z.string().optional(),
  interest_rate: z.number().min(0).max(10).optional(),
});

const usernameLoanRequestSchema = baseLoanRequestSchema.extend({
  borrower_username: z.string().min(2, 'Username must be at least 2 characters'),
});

export default function LoanRequestModal({ open, onClose, onSubmit }: LoanRequestModalProps) {
  const [activeTab, setActiveTab] = useState('username');
  const [formData, setFormData] = useState({
    borrower_username: '',
    amount: '',
    description: '',
    deadline: '',
    interest_rate: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQR, setShowQR] = useState(false);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.amount || formData.amount === '' || isNaN(parseFloat(formData.amount))) {
      setErrors({ amount: 'Please enter a valid amount' });
      toast.error('Please enter a valid loan amount');
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      setErrors({ description: 'Please enter a description' });
      toast.error('Please enter a description for the loan');
      return;
    }

    const requestData = {
      ...formData,
      amount: parseFloat(formData.amount),
      interest_rate: parseFloat(formData.interest_rate) || 0,
      deadline: formData.deadline || undefined,
    };

    try {
      if (activeTab === 'qr') {
        baseLoanRequestSchema.parse(requestData);
        setShowQR(true);
      } else {
        usernameLoanRequestSchema.parse(requestData);
        onSubmit({
          ...requestData,
          deadline: requestData.deadline || null,
        });
        handleClose();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error('Please fix the errors in the form');
      }
    }
  };

  const handleClose = () => {
    setFormData({
      borrower_username: '',
      amount: '',
      description: '',
      deadline: '',
      interest_rate: '0',
    });
    setErrors({});
    setShowQR(false);
    onClose();
  };

  if (showQR) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeDisplay
            loanData={{
              amount: parseFloat(formData.amount),
              reason: formData.description,
              deadline: formData.deadline || null,
            }}
            onClose={() => setShowQR(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request Loan</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="username">
              <Search className="h-4 w-4 mr-2" />
              Username
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="contacts" disabled>
              <Users className="h-4 w-4 mr-2" />
              Contacts (Soon)
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {activeTab === 'username' && (
              <div className="space-y-2">
                <Label htmlFor="borrower">Borrower Username *</Label>
                <Input
                  id="borrower"
                  value={formData.borrower_username}
                  onChange={(e) => setFormData({ ...formData, borrower_username: e.target.value })}
                  placeholder="johndoe"
                  required
                />
                {errors.borrower_username && (
                  <p className="text-sm text-red-600">{errors.borrower_username}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100.00"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500">Minimum $5, Maximum $500</p>
              {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Reason/Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What do you need this loan for?"
                rows={3}
                required
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Repayment Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Interest Rate (%) (Optional)</Label>
                <Input
                  id="interest"
                  type="number"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="0"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {activeTab === 'qr' ? 'Generate QR Code' : 'Send Request'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
