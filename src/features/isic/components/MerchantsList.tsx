import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isicAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { Store, TrendingDown, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface MerchantsListProps {
  preview?: boolean;
}

export default function MerchantsList({ preview = false }: MerchantsListProps) {
  const { isAuthenticated } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { data: merchantsData, isLoading } = useQuery({
    queryKey: ['merchants', selectedCategory],
    queryFn: async () => {
      const response = await isicAPI.getMerchants(selectedCategory);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const categories = ['All categories', 'Accommodation', 'Culture', 'Entertainment', 'Food and drink', 'Services', 'Shopping', 'Sport', 'Study', 'Travel', 'Other'];

  const displayedMerchants = preview 
    ? merchantsData?.merchants?.slice(0, 6) || []
    : merchantsData?.merchants || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading merchants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!preview && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === (category === 'All categories' ? undefined : category) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category === 'All categories' ? undefined : category)}
              className={selectedCategory === (category === 'All categories' ? undefined : category) ? 'bg-violet-600' : ''}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {displayedMerchants.map((merchant: any, index: number) => (
          <motion.div
            key={merchant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {merchant.logo_url || <Store className="h-6 w-6 text-violet-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{merchant.name}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 flex-shrink-0">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {merchant.discount_percentage}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{merchant.discount_description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {merchant.category}
                      </span>
                      {merchant.online_domain && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Online
                        </span>
                      )}
                      {merchant.nfc_enabled && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          In-store
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {displayedMerchants.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No merchants found</p>
        </div>
      )}

      {preview && merchantsData?.merchants?.length > 6 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            And {merchantsData.merchants.length - 6} more partner merchants...
          </p>
        </div>
      )}
    </div>
  );
}
