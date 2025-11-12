import { useQuery } from '@tanstack/react-query';
import { isicAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { TrendingDown, Calendar, Store, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscountHistory() {
  const { isAuthenticated } = useAuthStore();

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['discount-history'],
    queryFn: async () => {
      const response = await isicAPI.getDiscountHistory();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading history...</p>
      </div>
    );
  }

  const applications = historyData?.applications || [];

  return (
    <div className="space-y-4">
      {applications.length > 0 ? (
        <>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-green-700 mb-1">Total Savings</p>
              <p className="text-3xl font-bold text-green-600">
                ${historyData?.total_savings?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                from {applications.length} discount{applications.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {applications.map((app: any, index: number) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {app.detection_method === 'online' ? (
                              <Globe className="h-4 w-4 text-violet-600" />
                            ) : (
                              <MapPin className="h-4 w-4 text-violet-600" />
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900">{app.merchant_name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(app.applied_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {app.detection_method === 'online' ? 'Online' : 'In-store'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          -${app.discount_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          from ${app.original_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">No discounts used yet</h3>
            <p className="text-sm text-gray-600">
              Start shopping at partner merchants to see your savings here!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
