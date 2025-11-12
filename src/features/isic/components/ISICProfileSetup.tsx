import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isicAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface ISICProfileSetupProps {
  onSuccess?: () => void;
}

export default function ISICProfileSetup({ onSuccess }: ISICProfileSetupProps) {
  const [formData, setFormData] = useState({
    isic_number: '',
    student_name: '',
    university: '',
    expiry_date: '',
  });

  const queryClient = useQueryClient();

  const linkMutation = useMutation({
    mutationFn: (data: typeof formData) => isicAPI.linkProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isic-profile'] });
      toast.success('ISIC card linked successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to link ISIC card');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    linkMutation.mutate(formData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-violet-600" />
          Link Your ISIC Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="isic_number">ISIC Card Number</Label>
            <Input
              id="isic_number"
              value={formData.isic_number}
              onChange={(e) => setFormData({ ...formData, isic_number: e.target.value })}
              placeholder="e.g., ISIC123456789"
              required
            />
          </div>

          <div>
            <Label htmlFor="student_name">Full Name</Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              placeholder="As shown on your ISIC card"
              required
            />
          </div>

          <div>
            <Label htmlFor="university">University/Institution</Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              placeholder="Your university name"
              required
            />
          </div>

          <div>
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={linkMutation.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            {linkMutation.isPending ? 'Linking...' : 'Link ISIC Card'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
