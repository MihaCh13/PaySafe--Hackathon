/**
 * CustomSubscriptionForm Component
 * 
 * Purpose:
 *   Form for creating custom user-defined subscriptions.
 *   Allows users to add services not in the predefined catalog.
 * 
 * Expected Functions:
 *   - Input service name, category, and monthly cost
 *   - Select next billing date
 *   - Validate form inputs
 *   - Submit custom subscription
 * 
 * Current Implementation Status:
 *   [DONE] Form structure with validation
 *   [DONE] Service name input
 *   [DONE] Category selection
 *   [DONE] Monthly cost input
 *   [DONE] Next billing date picker
 *   [DONE] Form submission with mutation
 *   [DONE] Loading states
 *   [DONE] Success/error handling
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CustomSubscriptionForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    service_name: '',
    category: 'other',
    monthly_cost: '',
    next_billing_date: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await subscriptionsAPI.createSubscription({
        ...data,
        monthly_cost: parseFloat(data.monthly_cost),
        is_custom: true,
      });
    },
    onSuccess: () => {
      toast.success('Custom subscription created successfully!');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-statistics'] });
      
      // Reset form
      setFormData({
        service_name: '',
        category: 'other',
        monthly_cost: '',
        next_billing_date: '',
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to create subscription: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_name || !formData.monthly_cost || !formData.next_billing_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (parseFloat(formData.monthly_cost) <= 0) {
      toast.error('Monthly cost must be greater than 0');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service_name">Service Name *</Label>
          <Input
            id="service_name"
            placeholder="e.g., Adobe Creative Cloud"
            value={formData.service_name}
            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streaming">Streaming</SelectItem>
              <SelectItem value="cloud">Cloud Storage</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_cost">Monthly Cost ($) *</Label>
          <Input
            id="monthly_cost"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="9.99"
            value={formData.monthly_cost}
            onChange={(e) => setFormData({ ...formData, monthly_cost: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next_billing_date">Next Billing Date *</Label>
          <Input
            id="next_billing_date"
            type="date"
            value={formData.next_billing_date}
            onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={createMutation.isPending} className="w-full md:w-auto">
        {createMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Add Custom Subscription'
        )}
      </Button>
    </form>
  );
}
