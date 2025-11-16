import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { expectedPaymentsAPI } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, DollarSign, Repeat, Tag, FileText } from 'lucide-react';

interface ExpectedPaymentModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date;
  payment?: any;
}

export default function ExpectedPaymentModal({
  open,
  onClose,
  selectedDate,
  payment,
}: ExpectedPaymentModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!payment;

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    category: 'other',
    frequency: 'one-time',
    notes: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        title: payment.description || '',
        amount: payment.amount?.toString() || '',
        date: payment.created_at?.split('T')[0] || '',
        category: payment.metadata?.category || 'other',
        frequency: payment.metadata?.frequency || 'one-time',
        notes: payment.metadata?.notes || '',
      });
    } else if (selectedDate) {
      // Get timezone-safe local date key (YYYY-MM-DD) for Date object
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, date: dateStr }));
    }
  }, [payment, selectedDate]);

  const createMutation = useMutation({
    mutationFn: (data: any) => expectedPaymentsAPI.create(data),
    onSuccess: (response) => {
      toast.success('Expected payment created successfully');
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      
      if (formData.frequency !== 'one-time') {
        const paymentId = response.data.payment.id;
        generateRecurringMutation.mutate(paymentId);
      } else {
        onClose();
        resetForm();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create expected payment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => expectedPaymentsAPI.update(id, data),
    onSuccess: () => {
      toast.success('Expected payment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update expected payment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expectedPaymentsAPI.delete(id),
    onSuccess: () => {
      toast.success('Expected payment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete expected payment');
    },
  });

  const generateRecurringMutation = useMutation({
    mutationFn: (paymentId: number) => expectedPaymentsAPI.generateRecurring(paymentId, 12),
    onSuccess: (response) => {
      const count = response.data?.payments?.length || 0;
      toast.success(`Generated ${count} recurring payment instances`);
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate recurring payments');
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      date: '',
      category: 'other',
      frequency: 'one-time',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const data = {
      title: formData.title,
      amount,
      date: formData.date,
      category: formData.category,
      frequency: formData.frequency,
      notes: formData.notes,
    };

    if (isEditMode && payment) {
      updateMutation.mutate({ id: payment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (payment && window.confirm('Are you sure you want to delete this expected payment?')) {
      deleteMutation.mutate(payment.id);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Expected Payment' : 'Add Expected Payment'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of your expected payment'
              : 'Set up a payment you expect to make on this date'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Title / Description *
              </div>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Dorm Rent, Spotify, Electricity Bill"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount *
                </div>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </div>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </div>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">🏠 Housing / Rent</SelectItem>
                <SelectItem value="utilities">💡 Utilities</SelectItem>
                <SelectItem value="subscription">📺 Subscription</SelectItem>
                <SelectItem value="food">🍔 Food & Dining</SelectItem>
                <SelectItem value="transport">🚗 Transportation</SelectItem>
                <SelectItem value="education">📚 Education</SelectItem>
                <SelectItem value="entertainment">🎮 Entertainment</SelectItem>
                <SelectItem value="health">💊 Health & Fitness</SelectItem>
                <SelectItem value="other">📌 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Frequency
              </div>
            </Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">⚡ One-time payment</SelectItem>
                <SelectItem value="weekly">📅 Repeat weekly (same weekday)</SelectItem>
                <SelectItem value="monthly">🗓️ Repeat monthly (same date)</SelectItem>
              </SelectContent>
            </Select>
            {formData.frequency !== 'one-time' && (
              <p className="text-xs text-gray-500 mt-1">
                This will automatically create payment instances for the next 12 months
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditMode
                ? 'Update Payment'
                : 'Add Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
