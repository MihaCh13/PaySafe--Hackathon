/**
 * SubscriptionsList Component
 * 
 * Purpose:
 *   Displays user's active and paused subscriptions in a list format.
 *   Allows users to manage (pause, resume, cancel) their subscriptions.
 * 
 * Expected Functions:
 *   - Display active subscriptions
 *   - Display paused subscriptions
 *   - Pause/resume subscription status
 *   - Cancel subscriptions
 *   - Process manual payment
 * 
 * Current Implementation Status:
 *   [DONE] List display with filtering
 *   [DONE] Subscription cards with details
 *   [DONE] Pause/resume functionality
 *   [DONE] Cancel subscription
 *   [DONE] Manual payment processing
 *   [DONE] Per-item loading states
 *   [DONE] Empty states
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pause, Play, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SubscriptionsListProps {
  subscriptions: any[];
  loading: boolean;
}

export function SubscriptionsList({ subscriptions, loading }: SubscriptionsListProps) {
  const queryClient = useQueryClient();
  const [pausingIds, setPausingIds] = useState<Set<number>>(new Set());
  const [cancelingIds, setCancelingIds] = useState<Set<number>>(new Set());
  const [payingIds, setPayingIds] = useState<Set<number>>(new Set());

  // Pause/Resume mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      setPausingIds(prev => new Set(prev).add(id));
      return await subscriptionsAPI.updateSubscription(id, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      toast.success(`Subscription ${variables.newStatus === 'paused' ? 'paused' : 'resumed'}!`);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-statistics'] });
      setPausingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
    },
    onError: (error: any, variables) => {
      toast.error(`Failed to update subscription: ${error.response?.data?.error || error.message}`);
      setPausingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.id);
        return newSet;
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      setCancelingIds(prev => new Set(prev).add(id));
      return await subscriptionsAPI.cancelSubscription(id);
    },
    onSuccess: (_, id) => {
      toast.success('Subscription cancelled');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-statistics'] });
      setCancelingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
    onError: (error: any, id) => {
      toast.error(`Failed to cancel: ${error.response?.data?.error || error.message}`);
      setCancelingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      setPayingIds(prev => new Set(prev).add(id));
      return await subscriptionsAPI.processPayment(id);
    },
    onSuccess: (_, id) => {
      toast.success('Payment processed successfully!');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setPayingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
    onError: (error: any, id) => {
      toast.error(`Payment failed: ${error.response?.data?.error || error.message}`);
      setPayingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground mb-4">You don't have any subscriptions yet</p>
          <p className="text-sm text-muted-foreground">
            Browse the catalog to subscribe to popular services
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');

  return (
    <div className="space-y-6">
      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Subscriptions</h3>
          <div className="grid gap-4">
            {activeSubscriptions.map((sub) => (
              <Card key={sub.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{sub.service_name}</h4>
                        <Badge>{sub.category}</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {sub.status}
                        </Badge>
                        {sub.is_custom && <Badge variant="secondary">Custom</Badge>}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-muted-foreground">Monthly Cost</p>
                          <p className="font-semibold">${sub.monthly_cost}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Paid</p>
                          <p className="font-semibold">${sub.total_paid}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Billing</p>
                          <p className="font-semibold">
                            {sub.next_billing_date ? format(new Date(sub.next_billing_date), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Billing</p>
                          <p className="font-semibold">
                            {sub.last_billing_date ? format(new Date(sub.last_billing_date), 'MMM dd, yyyy') : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate({ id: sub.id, newStatus: 'paused' })}
                        disabled={pausingIds.has(sub.id)}
                      >
                        {pausingIds.has(sub.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processPaymentMutation.mutate(sub.id)}
                        disabled={payingIds.has(sub.id)}
                        title="Process payment now"
                      >
                        {payingIds.has(sub.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelMutation.mutate(sub.id)}
                        disabled={cancelingIds.has(sub.id)}
                      >
                        {cancelingIds.has(sub.id) ? (
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
        </div>
      )}

      {/* Paused Subscriptions */}
      {pausedSubscriptions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Paused Subscriptions</h3>
          <div className="grid gap-4">
            {pausedSubscriptions.map((sub) => (
              <Card key={sub.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{sub.service_name}</h4>
                        <Badge>{sub.category}</Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {sub.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Monthly Cost: ${sub.monthly_cost}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate({ id: sub.id, newStatus: 'active' })}
                        disabled={pausingIds.has(sub.id)}
                      >
                        {pausingIds.has(sub.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelMutation.mutate(sub.id)}
                        disabled={cancelingIds.has(sub.id)}
                      >
                        {cancelingIds.has(sub.id) ? (
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
        </div>
      )}
    </div>
  );
}
