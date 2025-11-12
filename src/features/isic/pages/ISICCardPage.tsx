import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isicAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import ISICCardFull from '../components/ISICCardFull';
import ISICProfileSetup from '../components/ISICProfileSetup';
import MerchantsList from '../components/MerchantsList';
import DiscountHistory from '../components/DiscountHistory';
import { ISICCardUploadModal } from '@/features/cards/components/ISICCardUploadModal';
import { UploadedISICCardView } from '@/features/cards/components/UploadedISICCardView';
import { CreditCard, Store, History, TrendingDown, AlertCircle, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency } from '@/stores/currencyStore';

const MotionCard = motion.create(Card);

export default function ISICCardPage() {
  const { isAuthenticated } = useAuthStore();
  const { selectedCurrency } = useCurrencyStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['isic-profile'],
    queryFn: async () => {
      const response = await isicAPI.getProfile();
      return response.data.profile;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: savingsData } = useQuery({
    queryKey: ['isic-savings'],
    queryFn: async () => {
      const response = await isicAPI.getSavingsStats();
      return response.data;
    },
    enabled: isAuthenticated && !!profileData,
  });

  const unlinkMutation = useMutation({
    mutationFn: () => isicAPI.unlinkProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isic-profile'] });
      toast.success('ISIC profile unlinked successfully');
    },
    onError: () => {
      toast.error('Failed to unlink ISIC profile');
    },
  });

  const handleUnlink = () => {
    if (confirm('Are you sure you want to unlink your ISIC card?')) {
      unlinkMutation.mutate();
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ISIC profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData && !showSetup) {
    return (
      <div className="max-w-4xl mx-auto">
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-0 shadow-lg"
        >
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-6">
              <CreditCard className="h-10 w-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Link Your ISIC Card
            </h2>
            <p className="text-gray-600 mb-2">
              Get automatic student discounts at hundreds of partner merchants
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Save up to 50% on food, retail, entertainment, and more!
            </p>
            <Button
              onClick={() => setShowSetup(true)}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              Link ISIC Card Now
            </Button>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 border-0 shadow"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-violet-600" />
              Partner Merchants Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MerchantsList preview={true} />
          </CardContent>
        </MotionCard>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setShowSetup(false)}
          className="mb-4"
        >
          ← Back
        </Button>
        <ISICProfileSetup onSuccess={() => setShowSetup(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ISIC Student Card</h1>
          <p className="text-gray-600 mt-1">
            Your gateway to exclusive student discounts
          </p>
        </div>
      </div>

      {profileData?.is_expired && (
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-l-4 border-l-red-500 bg-red-50"
        >
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">ISIC Card Expired</p>
              <p className="text-sm text-red-700">
                Your ISIC card expired on {profileData.expiry_date}. Please renew to continue receiving discounts.
              </p>
            </div>
          </CardContent>
        </MotionCard>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-0 shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(savingsData?.total_savings || 0, selectedCurrency)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="border-0 shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Discounts Used</p>
                <p className="text-2xl font-bold text-violet-600">
                  {savingsData?.discount_count || 0}
                </p>
              </div>
              <div className="p-3 bg-violet-100 rounded-full">
                <History className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="border-0 shadow-sm"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Card</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profileData?.isic_number?.slice(-4) || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </MotionCard>
      </div>

      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="card">My Card</TabsTrigger>
          <TabsTrigger value="merchants">Merchants</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="space-y-4">
          <ISICCardFull profile={profileData} />
          
          <UploadedISICCardView onReupload={() => setShowUploadModal(true)} />
          
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Upload Card Screenshot
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload a photo of your ISIC card for faster merchant verification and enhanced discount features.
                  </p>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Card Screenshot
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Card Settings</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={unlinkMutation.isPending}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  {unlinkMutation.isPending ? 'Unlinking...' : 'Unlink ISIC Card'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merchants">
          <MerchantsList />
        </TabsContent>

        <TabsContent value="history">
          <DiscountHistory />
        </TabsContent>
      </Tabs>

      <ISICCardUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        cardId=""
      />
    </div>
  );
}
