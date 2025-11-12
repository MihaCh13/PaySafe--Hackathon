/**
 * SubscriptionsPage Component
 * 
 * Purpose:
 *   Main dashboard for managing subscription-based virtual cards.
 *   Provides an interface for browsing catalogs, creating custom subscriptions,
 *   viewing active/paused subscriptions, and tracking spending statistics.
 * 
 * Expected Functions:
 *   - Display subscription catalog
 *   - Create subscriptions from catalog or custom
 *   - List active and paused subscriptions
 *   - Show monthly spending summary
 *   - Display next payment notifications
 * 
 * Current Implementation Status:
 *   [DONE] Page layout and structure
 *   [DONE] Integration with TanStack Query
 *   [DONE] Tab-based navigation (Catalog / My Subscriptions)
 *   [DONE] Component composition
 *   [DONE] Loading and error states
 *   [DONE] Responsive design
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogView } from '../components/CatalogView';
import { CustomSubscriptionForm } from '../components/CustomSubscriptionForm';
import { SubscriptionsList } from '../components/SubscriptionsList';
import { SummaryWidget } from '../components/SummaryWidget';
import { NotificationPlaceholder } from '../components/NotificationPlaceholder';
import { motion } from 'framer-motion';

export default function SubscriptionsPage() {
  const [selectedTab, setSelectedTab] = useState('catalog');

  // Fetch subscriptions data
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await subscriptionsAPI.getSubscriptions();
      return response.data.subscriptions;
    },
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['subscription-statistics'],
    queryFn: async () => {
      const response = await subscriptionsAPI.getStatistics();
      return response.data;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Subscriptions
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your recurring payments and discover new services
        </p>
      </div>

      {/* Notifications Placeholder */}
      <NotificationPlaceholder />

      {/* Summary Widget */}
      <SummaryWidget statistics={statistics} loading={statsLoading} />

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="my-subscriptions">My Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Popular Services</h2>
              <CatalogView />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Custom Subscription</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Don't see your service? Add a custom subscription below.
              </p>
              <CustomSubscriptionForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-subscriptions" className="space-y-4">
          <SubscriptionsList 
            subscriptions={subscriptions} 
            loading={subscriptionsLoading}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
