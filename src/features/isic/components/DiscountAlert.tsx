import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, TrendingDown, CreditCard, AlertTriangle } from 'lucide-react';

interface DiscountAlertProps {
  merchant: {
    name: string;
    logo_url?: string;
    discount_percentage: number;
    discount_description: string;
  };
  amount: number;
  discountAmount: number;
  finalAmount: number;
  onShowCard: () => void;
  onDismiss: () => void;
  type?: 'online' | 'physical';
}

export default function DiscountAlert({
  merchant,
  amount,
  discountAmount,
  finalAmount,
  onShowCard,
  onDismiss,
  type = 'online',
}: DiscountAlertProps) {
  if (type === 'physical') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6"
              >
                <AlertTriangle className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Discount Detected!</h2>
              <p className="text-gray-600 mb-6">
                Show your ISIC card at {merchant.name} to get{' '}
                <span className="font-bold text-green-600">{merchant.discount_percentage}% off</span>
              </p>

              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Original Amount:</span>
                  <span className="font-semibold">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-green-600">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Final Amount:</span>
                  <span className="text-xl font-bold text-green-600">${finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={onShowCard}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 h-12 text-base"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Show ISIC Card
                </Button>
                <Button onClick={onDismiss} variant="ghost" className="w-full">
                  Continue without discount
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
    >
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <h3 className="font-bold text-gray-900">{merchant.discount_percentage}% Student Discount!</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Save ${discountAmount.toFixed(2)} at {merchant.name}
              </p>
              <Button
                onClick={onShowCard}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Show ISIC Card
              </Button>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
