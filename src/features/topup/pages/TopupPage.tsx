import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Banknote, QrCode, Wallet, Copy, Check } from 'lucide-react';
import { walletAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertCurrency, convertToUSD } from '@/stores/currencyStore';
import { QRCodeSVG } from 'qrcode.react';

const MotionCard = motion.create(Card);

export default function TopupPage() {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'card' | 'qr'>('card');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useAuthStore();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await walletAPI.getWallet();
      return response.data.wallet;
    },
  });

  const topupMutation = useMutation({
    mutationFn: ({ amount, method }: { amount: number; method: string }) =>
      walletAPI.topup(amount, method),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      toast.success(`Successfully added ${formatCurrency(variables.amount, selectedCurrency)} to your wallet!`);
      setAmount('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Top-up failed');
    },
  });

  const handleTopup = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const amountInUSD = convertToUSD(Number(amount), selectedCurrency);
    topupMutation.mutate({
      amount: amountInUSD,
      method: selectedMethod,
    });
  };

  const loadQRToken = async () => {
    try {
      const response = await walletAPI.generateQRToken();
      setQrToken(response.data.token);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleShowQR = () => {
    setShowQRDialog(true);
    if (!qrToken) {
      loadQRToken();
    }
  };

  const handleShowBankDetails = () => {
    setShowBankDialog(true);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const bankDetails = {
    accountName: 'UniPay Student Account',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    swiftCode: 'UNIPAYXX',
    bankName: 'UniPay Digital Bank',
    reference: user?.username || 'N/A',
  };

  const quickAmounts = [10, 25, 50, 100, 200];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Top Up Wallet
        </h1>
        <p className="text-gray-600 mt-2">Add funds to your digital wallet</p>
      </div>

      <MotionCard variants={itemVariants} className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
              <p className="text-3xl font-bold text-violet-600">
                {formatCurrency(walletData?.balance || 0, selectedCurrency)}
              </p>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      <MotionCard variants={itemVariants}>
        <CardHeader>
          <CardTitle>Select Top-up Method</CardTitle>
          <CardDescription>Choose how you'd like to add funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedMethod === 'card'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('card')}
            >
              <CreditCard className={`h-8 w-8 mb-3 mx-auto ${
                selectedMethod === 'card' ? 'text-violet-600' : 'text-gray-400'
              }`} />
              <p className="font-medium">Credit/Debit Card</p>
              <p className="text-sm text-gray-500 mt-1">Instant transfer</p>
            </button>

            <button
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedMethod === 'bank'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod('bank')}
            >
              <Banknote className={`h-8 w-8 mb-3 mx-auto ${
                selectedMethod === 'bank' ? 'text-violet-600' : 'text-gray-400'
              }`} />
              <p className="font-medium">Bank Transfer</p>
              <p className="text-sm text-gray-500 mt-1">1-2 business days</p>
            </button>

            <button
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedMethod === 'qr'
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedMethod('qr');
                handleShowQR();
              }}
            >
              <QrCode className={`h-8 w-8 mb-3 mx-auto ${
                selectedMethod === 'qr' ? 'text-violet-600' : 'text-gray-400'
              }`} />
              <p className="font-medium">QR Code</p>
              <p className="text-sm text-gray-500 mt-1">Scan to pay</p>
            </button>
          </div>

          {selectedMethod === 'bank' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                📋 Bank transfer details available below
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShowBankDetails}
              >
                <Banknote className="h-4 w-4 mr-2" />
                View Bank Transfer Details
              </Button>
            </div>
          )}

          {selectedMethod === 'qr' && (
            <div className="p-4 bg-violet-50 dark:bg-violet-950 rounded-lg border border-violet-200">
              <p className="text-sm text-violet-800 dark:text-violet-200 mb-3">
                📱 Share your QR code with others to receive payments
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShowQR}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Show My QR Code
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Quick amounts:</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(convertCurrency(quickAmount, selectedCurrency).toString())}
                  >
                    {formatCurrency(quickAmount, selectedCurrency)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-lg py-6"
              onClick={handleTopup}
              disabled={topupMutation.isPending || !amount || Number(amount) <= 0}
            >
              {topupMutation.isPending ? 'Processing...' : `Top Up ${amount ? formatCurrency(convertToUSD(Number(amount), selectedCurrency), selectedCurrency) : formatCurrency(0, selectedCurrency)}`}
            </Button>

            <p className="text-sm text-gray-500 text-center">
              Funds will be added instantly to your wallet
            </p>
          </div>
        </CardContent>
      </MotionCard>

      <MotionCard variants={itemVariants} className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Top-up Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Minimum top-up amount: $1.00</li>
            <li>• Card payments are processed instantly</li>
            <li>• Bank transfers may take 1-2 business days</li>
            <li>• QR codes expire after 5 minutes for security</li>
            <li>• All transactions are secured with SSL encryption</li>
          </ul>
        </CardContent>
      </MotionCard>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => {
        setShowQRDialog(open);
        if (open && !qrToken) {
          loadQRToken();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Payment via QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="p-6 bg-white rounded-xl shadow-lg">
              {qrToken ? (
                <QRCodeSVG
                  value={qrToken}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <p className="text-gray-400">Loading...</p>
                </div>
              )}
            </div>
            <div className="text-center w-full">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                @{user?.username}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Others can scan this code to send you money
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 mb-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ⏱️ QR code expires in 5 minutes for security
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadQRToken}
                  className="flex-1"
                >
                  Refresh Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowBankDetails}
                  className="flex-1"
                >
                  Bank Details
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Transfer Details Dialog */}
      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bank Transfer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use these details to transfer funds via bank transfer
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Name</p>
                    <p className="font-medium">{bankDetails.accountName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.accountName, 'Account Name')}
                  >
                    {copiedField === 'Account Name' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Number</p>
                    <p className="font-medium font-mono">{bankDetails.accountNumber}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}
                  >
                    {copiedField === 'Account Number' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Routing Number</p>
                    <p className="font-medium font-mono">{bankDetails.routingNumber}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.routingNumber, 'Routing Number')}
                  >
                    {copiedField === 'Routing Number' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">SWIFT Code</p>
                    <p className="font-medium font-mono">{bankDetails.swiftCode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.swiftCode, 'SWIFT Code')}
                  >
                    {copiedField === 'SWIFT Code' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}
                  >
                    {copiedField === 'Bank Name' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-violet-50 dark:bg-violet-950 rounded-lg border border-violet-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">
                      Payment Reference (IMPORTANT)
                    </p>
                    <p className="font-bold text-violet-700 dark:text-violet-300">
                      {bankDetails.reference}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.reference, 'Reference')}
                  >
                    {copiedField === 'Reference' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Important:</strong> Always include your payment reference ({bankDetails.reference}) 
                so we can credit your account correctly.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
