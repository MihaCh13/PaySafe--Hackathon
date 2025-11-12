/**
 * SummaryWidget Component
 * 
 * Purpose:
 *   Displays subscription spending summary and statistics.
 *   Shows total monthly cost, next payment date, and category breakdown.
 * 
 * Expected Functions:
 *   - Display total monthly spending
 *   - Show next billing date and amount
 *   - Show count of active/paused subscriptions
 *   - Display category-wise spending breakdown
 * 
 * Current Implementation Status:
 *   [DONE] Statistics display
 *   [DONE] Gradient card design
 *   [DONE] Loading states
 *   [DONE] Empty states
 *   [DONE] Category breakdown
 */

import { Card, CardContent } from '@/components/ui/card';
import { Loader2, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface SummaryWidgetProps {
  statistics: any;
  loading: boolean;
}

export function SummaryWidget({ statistics, loading }: SummaryWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Monthly Spending */}
      <Card className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Monthly Spending</p>
              <p className="text-3xl font-bold">${statistics.total_monthly_cost?.toFixed(2) || '0.00'}</p>
              <p className="text-xs opacity-75 mt-2">
                {statistics.active_subscriptions || 0} active subscription{statistics.active_subscriptions !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Payment */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
              {statistics.next_billing ? (
                <>
                  <p className="text-2xl font-bold">${statistics.next_billing.amount?.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(statistics.next_billing.date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statistics.next_billing.service_name}
                  </p>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">No upcoming payments</p>
              )}
            </div>
            <div className="bg-violet-100 p-3 rounded-full">
              <Calendar className="h-8 w-8 text-violet-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-bold">${statistics.total_paid?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {statistics.total_subscriptions || 0} subscription{statistics.total_subscriptions !== 1 ? 's' : ''} lifetime
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {statistics.category_spending && Object.keys(statistics.category_spending).length > 0 && (
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.category_spending).map(([category, amount]: [string, any]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium capitalize">{category}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                  <p className="text-lg font-bold">${amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
