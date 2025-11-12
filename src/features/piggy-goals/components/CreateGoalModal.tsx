import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

interface CreateGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => void;
  activeGoalsCount?: number;
}

const goalSchema = z.object({
  name: z.string()
    .min(3, 'Goal name must be at least 3 characters')
    .max(50, 'Goal name must be less than 50 characters'),
  target_amount: z.number()
    .min(10, 'Target amount must be at least $10')
    .max(100000, 'Target amount cannot exceed $100,000'),
  deadline: z.string()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) > new Date();
    }, 'Deadline must be a future date')
    .optional(),
  description: z.string().optional(),
  icon: z.string(),
});

const GOAL_ICONS = [
  { emoji: '🎓', label: 'Education', category: 'study' },
  { emoji: '💻', label: 'Electronics', category: 'tech' },
  { emoji: '✈️', label: 'Travel', category: 'travel' },
  { emoji: '🎮', label: 'Entertainment', category: 'fun' },
  { emoji: '🏠', label: 'Housing', category: 'home' },
  { emoji: '💼', label: 'Emergency Fund', category: 'emergency' },
  { emoji: '🎯', label: 'Other', category: 'other' },
];

export default function CreateGoalModal({ open, onClose, onSubmit, activeGoalsCount = 0 }: CreateGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    description: '',
    icon: '🎯',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      deadline: formData.deadline || undefined,
    };

    try {
      goalSchema.parse(goalData);
      
      onSubmit({
        ...goalData,
        deadline: goalData.deadline || null,
      });
      
      setFormData({
        name: '',
        target_amount: '',
        deadline: '',
        description: '',
        icon: '🎯',
      });
      setErrors({});
      onClose();
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Savings Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icon">Choose Icon</Label>
            <div className="grid grid-cols-7 gap-2">
              {GOAL_ICONS.map((item) => (
                <button
                  key={item.emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: item.emoji })}
                  className={`
                    text-3xl p-3 rounded-lg border-2 transition-all hover:scale-110
                    ${formData.icon === item.emoji 
                      ? 'border-violet-500 bg-violet-50 scale-110' 
                      : 'border-gray-200 hover:border-violet-300'
                    }
                  `}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Goal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., New Laptop, Spring Break Trip"
              required
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Target Amount ($) *</Label>
            <Input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              placeholder="1000.00"
              required
              step="0.01"
            />
            {errors.target_amount && <p className="text-sm text-red-600">{errors.target_amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.deadline && <p className="text-sm text-red-600">{errors.deadline}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why are you saving for this?"
              rows={3}
            />
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
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
