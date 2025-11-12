/**
 * CatalogView Component
 * 
 * Purpose:
 *   Displays a grid of predefined subscription services (Spotify, Netflix, etc.)
 *   Allows users to subscribe to popular services with one click.
 * 
 * Expected Functions:
 *   - Fetch and display subscription catalog
 *   - Filter by category
 *   - Subscribe to predefined services
 *   - Show service details (price, description, icon)
 * 
 * Current Implementation Status:
 *   [DONE] Catalog fetching with React Query
 *   [DONE] Grid layout display
 *   [DONE] Category filtering
 *   [DONE] Subscribe functionality
 *   [DONE] Loading states
 *   [DONE] Service card design
 *   [DONE] Success/error toast notifications
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CatalogView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch catalog
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['subscription-catalog', selectedCategory],
    queryFn: async () => {
      const response = await subscriptionsAPI.getCatalog(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      return response.data.catalog;
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (service: any) => {
      setSubscribingIds(prev => new Set(prev).add(service.id));
      
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      
      return await subscriptionsAPI.createSubscription({
        service_name: service.service_name,
        category: service.category,
        monthly_cost: service.monthly_cost,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        is_custom: false,
        icon_url: service.icon_url,
        description: service.description,
      });
    },
    onSuccess: (_, service) => {
      toast.success(`Subscribed to ${service.service_name}!`);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-statistics'] });
      setSubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    },
    onError: (error: any, service) => {
      toast.error(`Failed to subscribe: ${error.response?.data?.error || error.message}`);
      setSubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(service.id);
        return newSet;
      });
    },
  });

  // Extract categories
  const categories: string[] = catalog ? Array.from(new Set(catalog.map((s: any) => s.category))) : [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Filter by category:</span>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category: string) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog?.map((service: any) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: service.color + '20' }}
                  >
                    <span className="text-2xl">{service.service_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{service.service_name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {service.category}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">${service.monthly_cost}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => subscribeMutation.mutate(service)}
                  disabled={subscribingIds.has(service.id)}
                >
                  {subscribingIds.has(service.id) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Subscribe
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {catalog?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No services found in this category
        </div>
      )}
    </div>
  );
}
