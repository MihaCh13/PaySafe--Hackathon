import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pause, Play, Trash2, Edit, Eye, EyeOff, Copy, Hash, Lock, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const manualSubscriptionSchema = z.object({
  service_name: z.string().min(2, 'Service name must be at least 2 characters'),
  category: z.enum(['streaming', 'software', 'fitness', 'education', 'entertainment', 'other']),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  billing_cycle: z.enum(['monthly', 'yearly']),
  next_billing_date: z.string().min(1, 'Next billing date is required'),
});

interface SubscriptionCardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
}

export function SubscriptionCardDetailDialog({
  open,
  onOpenChange,
  cardId,
}: SubscriptionCardDetailDialogProps) {
  const [selectedTab, setSelectedTab] = useState('active');
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());
  const [actioningIds, setActioningIds] = useState<Set<number>>(new Set());
  const [showSensitive, setShowSensitive] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(manualSubscriptionSchema),
    defaultValues: {
      service_name: '',
      category: 'other' as const,
      amount: '',
      billing_cycle: 'monthly' as const,
      next_billing_date: '',
    },
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['card-catalog', cardId],
    queryFn: async () => {
      const response = await cardsAPI.getCardCatalog(cardId);
      return response.data.catalog;
    },
    enabled: open && !!cardId,
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['card-subscriptions', cardId],
    queryFn: async () => {
      const response = await cardsAPI.getSubscriptions(cardId);
      return response.data.subscriptions;
    },
    enabled: open && !!cardId,
  });

  const { data: card, isLoading: cardLoading } = useQuery({
    queryKey: ['card-detail', cardId],
    queryFn: async () => {
      const response = await cardsAPI.getCard(cardId);
      return response.data.card;
    },
    enabled: open && !!cardId,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const subscribeMutation = useMutation({
    mutationFn: async (service: any) => {
      setSubscribingIds(prev => new Set(prev).add(service.id));
      
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      
      return await cardsAPI.addSubscriptionToCard(cardId, {
        service_name: service.service_name,
        category: service.category,
        amount: service.monthly_cost,
        billing_cycle: 'monthly',
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
      });
    },
    onSuccess: (_, service) => {
      toast.success(`Added ${service.service_name}!`);
      queryClient.invalidateQueries({ queryKey: ['card-subscriptions', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    },
    onError: (error: any, service) => {
      toast.error(`Failed to add: ${error.response?.data?.error || error.message}`);
      setSubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (subId: number) => {
      setActioningIds(prev => new Set(prev).add(subId));
      return await cardsAPI.pauseSubscription(cardId, subId);
    },
    onSuccess: (_, subId) => {
      toast.success('Subscription paused');
      queryClient.invalidateQueries({ queryKey: ['card-subscriptions', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
    onError: (error: any, subId) => {
      toast.error(`Failed to pause: ${error.response?.data?.error || error.message}`);
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (subId: number) => {
      setActioningIds(prev => new Set(prev).add(subId));
      return await cardsAPI.resumeSubscription(cardId, subId);
    },
    onSuccess: (_, subId) => {
      toast.success('Subscription resumed');
      queryClient.invalidateQueries({ queryKey: ['card-subscriptions', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
    onError: (error: any, subId) => {
      toast.error(`Failed to resume: ${error.response?.data?.error || error.message}`);
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subId: number) => {
      setActioningIds(prev => new Set(prev).add(subId));
      return await cardsAPI.deleteSubscription(cardId, subId);
    },
    onSuccess: (_, subId) => {
      toast.success('Subscription removed');
      queryClient.invalidateQueries({ queryKey: ['card-subscriptions', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
    onError: (error: any, subId) => {
      toast.error(`Failed to remove: ${error.response?.data?.error || error.message}`);
      setActioningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(subId);
        return newSet;
      });
    },
  });

  const addManualSubscriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof manualSubscriptionSchema>) => {
      return await cardsAPI.addSubscriptionToCard(cardId, {
        service_name: data.service_name,
        category: data.category,
        amount: parseFloat(data.amount),
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date,
      });
    },
    onSuccess: () => {
      toast.success('Custom subscription added!');
      queryClient.invalidateQueries({ queryKey: ['card-subscriptions', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      form.reset();
      setSelectedTab('active');
    },
    onError: (error: any) => {
      toast.error(`Failed to add: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleManualSubmit = form.handleSubmit((data) => {
    addManualSubscriptionMutation.mutate(data);
  });

  const activeSubscriptions = subscriptions?.filter((s: any) => s.is_active) || [];
  const totalMonthlySpend = activeSubscriptions.reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);

  const isServiceAlreadyAdded = (serviceName: string) => {
    return subscriptions?.some((sub: any) => 
      sub.service_name === serviceName && sub.is_active
    ) || false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            My Subscriptions
          </DialogTitle>
          <DialogDescription>
            Manage your recurring subscriptions and discover new services
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              <div className="text-2xl font-bold mt-1">{activeSubscriptions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Monthly Spend</div>
              <div className="text-2xl font-bold mt-1">${totalMonthlySpend.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">Active ({activeSubscriptions.length})</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="custom">
              <Edit className="h-4 w-4 mr-1" />
              Custom
            </TabsTrigger>
            <TabsTrigger value="banking">
              <CreditCard className="h-4 w-4 mr-1" />
              Banking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {subscriptionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : activeSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">No active subscriptions yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Browse the Available tab to add your first subscription!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub: any) => (
                  <Card key={sub.id} className={!sub.is_active ? 'opacity-50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{sub.service_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{sub.category}</p>
                          <p className="text-sm mt-1">
                            ${parseFloat(sub.amount).toFixed(2)}/{sub.billing_cycle}
                          </p>
                          {sub.next_billing_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Next billing: {format(new Date(sub.next_billing_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                            {sub.is_active ? 'Active' : 'Paused'}
                          </Badge>
                          {sub.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pauseMutation.mutate(sub.id)}
                              disabled={actioningIds.has(sub.id)}
                            >
                              {actioningIds.has(sub.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pause className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resumeMutation.mutate(sub.id)}
                              disabled={actioningIds.has(sub.id)}
                            >
                              {actioningIds.has(sub.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(sub.id)}
                            disabled={actioningIds.has(sub.id)}
                          >
                            {actioningIds.has(sub.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-4">
            {catalogLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog?.map((service: any) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.service_name}</h3>
                          <Badge variant="outline" className="mt-1 capitalize">
                            {service.category}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-2">
                            {service.description}
                          </p>
                          <p className="text-lg font-bold mt-3 text-violet-600">
                            ${service.monthly_cost}/month
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        onClick={() => subscribeMutation.mutate(service)}
                        disabled={subscribingIds.has(service.id) || isServiceAlreadyAdded(service.service_name)}
                      >
                        {subscribingIds.has(service.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : isServiceAlreadyAdded(service.service_name) ? (
                          <>
                            Already Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subscription
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Add a custom subscription that's not in our catalog
                  </div>

                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_name">Service Name</Label>
                      <Input
                        id="service_name"
                        placeholder="e.g., Gym Membership, Cloud Storage..."
                        {...form.register('service_name')}
                      />
                      {form.formState.errors.service_name && (
                        <p className="text-sm text-red-500">{form.formState.errors.service_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={form.watch('category')}
                        onValueChange={(value) => form.setValue('category', value as any)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="streaming">Streaming</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.category && (
                        <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="9.99"
                          {...form.register('amount')}
                        />
                        {form.formState.errors.amount && (
                          <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billing_cycle">Billing Cycle</Label>
                        <Select
                          value={form.watch('billing_cycle')}
                          onValueChange={(value) => form.setValue('billing_cycle', value as any)}
                        >
                          <SelectTrigger id="billing_cycle">
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.billing_cycle && (
                          <p className="text-sm text-red-500">{form.formState.errors.billing_cycle.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next_billing_date">Next Billing Date</Label>
                      <Input
                        id="next_billing_date"
                        type="date"
                        {...form.register('next_billing_date')}
                      />
                      {form.formState.errors.next_billing_date && (
                        <p className="text-sm text-red-500">{form.formState.errors.next_billing_date.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={addManualSubscriptionMutation.isPending}
                    >
                      {addManualSubscriptionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Subscription
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banking Details Tab */}
          <TabsContent value="banking" className="mt-4">
            {cardLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : !card ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">Failed to load card details</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Banking Information</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSensitive(!showSensitive)}
                    >
                      {showSensitive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use these banking details for transfers and payments linked to your subscription card.
                  </p>
                  <div className="h-px bg-border" />

                  {/* IBAN */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Hash className="h-4 w-4" />
                        <span>IBAN</span>
                      </div>
                      <div className="font-mono text-sm">
                        {showSensitive ? card.iban : '••••••••••••••••••••'}
                      </div>
                    </div>
                    {showSensitive && card.iban && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(card.iban, 'IBAN')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* SWIFT/BIC */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Lock className="h-4 w-4" />
                        <span>SWIFT/BIC</span>
                      </div>
                      <div className="font-mono text-sm">
                        {showSensitive ? card.swift : '••••••••'}
                      </div>
                    </div>
                    {showSensitive && card.swift && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(card.swift, 'SWIFT/BIC')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created</span>
                      </div>
                      <div className="text-sm">
                        {card.created_at ? format(new Date(card.created_at), 'MMMM dd, yyyy \'at\' h:mm a') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex gap-3">
                      <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">Security Notice</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Keep your banking details secure. This card can be used for subscription payments and transfers.
                          UniPay will never ask for these details via email or phone.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
