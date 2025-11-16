import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpRight, ArrowDownLeft, Send, Users, Calendar, QrCode, ScanLine, X, Banknote, Copy, Check } from 'lucide-react';
import { walletAPI, transactionsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertToUSD } from '@/stores/currencyStore';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

const MotionCard = motion.create(Card);

interface ScheduledTransfer {
  id: string;
  recipient: string;
  amount: number;
  scheduledDate: string;
  createdAt: string;
}

export default function TransfersPage() {
  const { user } = useAuthStore();
  const { selectedCurrency } = useCurrencyStore();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await walletAPI.getWallet();
      return response.data.wallet;
    },
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsAPI.getTransactions(1, 100);
      return response.data;
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ recipient, amount }: { recipient: string; amount: number }) =>
      walletAPI.transfer(recipient, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSendDialogOpen(false);
      toast.success('Transfer successful!');
      setRecipientUsername('');
      setAmount('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Transfer failed');
    },
  });

  const handleSendMoney = () => {
    if (!recipientUsername || !amount || Number(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }

    const amountInUSD = convertToUSD(Number(amount), selectedCurrency);

    if (isScheduled) {
      if (!scheduledDate) {
        toast.error('Please select a date for scheduled transfer');
        return;
      }

      const newScheduledTransfer: ScheduledTransfer = {
        id: Date.now().toString(),
        recipient: recipientUsername,
        amount: amountInUSD,
        scheduledDate,
        createdAt: new Date().toISOString(),
      };

      setScheduledTransfers([...scheduledTransfers, newScheduledTransfer]);
      setSendDialogOpen(false);
      toast.success(`Transfer to @${recipientUsername} scheduled for ${new Date(scheduledDate).toLocaleDateString()}`);
      setRecipientUsername('');
      setAmount('');
      setScheduledDate('');
      setIsScheduled(false);
    } else {
      transferMutation.mutate({
        recipient: recipientUsername,
        amount: amountInUSD,
      });
    }
  };

  const startQRScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopQRScanner();
          handleQRScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error('QR Scanner error:', error);
      toast.error('Failed to start QR scanner. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const stopQRScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setScannerDialogOpen(false);
      }).catch((error) => {
        console.error('Error stopping scanner:', error);
        setIsScanning(false);
      });
    }
  };

  const handleQRScanSuccess = async (decodedText: string) => {
    try {
      // Verify the token with the backend
      const response = await walletAPI.verifyQRToken(decodedText);
      const { recipient } = response.data;
      
      if (recipient && recipient.username) {
        setRecipientUsername(recipient.username);
        setSendDialogOpen(true);
        toast.success(`Recipient set to @${recipient.username}`, {
          description: recipient.full_name || 'Verified recipient'
        });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Invalid or expired QR code';
      toast.error(errorMsg);
    }
  };

  const loadQRToken = async () => {
    try {
      const response = await walletAPI.generateQRToken();
      setQrToken(response.data.token);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleScanClick = () => {
    setScannerDialogOpen(true);
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
    accountName: 'UniPay Transfer Service',
    accountNumber: '9876543210',
    routingNumber: '021000021',
    swiftCode: 'UNIPAYXX',
    bankName: 'UniPay Digital Bank',
    iban: 'US12UNIP0210000219876543210',
  };

  useEffect(() => {
    if (scannerDialogOpen && scannerRef.current && !isScanning) {
      startQRScanner();
    }

    return () => {
      if (isScanning) {
        stopQRScanner();
      }
    };
  }, [scannerDialogOpen]);

  const recentTransfers = transactionsData?.transactions?.filter(
    (tx: any) => 
      tx.transaction_type === 'transfer_sent' || 
      tx.transaction_type === 'transfer_received' ||
      tx.transaction_type === 'transfer'
  ).slice(0, 10) || [];

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
      className="p-6 max-w-7xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Transfers
        </h1>
        <p className="text-gray-600 mt-2">Send and receive money instantly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MotionCard variants={itemVariants} className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl">
                <ArrowUpRight className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Send Money</CardTitle>
                <CardDescription>Transfer funds to any user</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Available Balance:{' '}
              <span className="font-bold text-violet-600">
                {formatCurrency(walletData?.balance || 0, selectedCurrency)}
              </span>
            </p>
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
              onClick={() => setSendDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Username
            </Button>
            <Button
              variant="outline"
              className="w-full border-violet-200 hover:bg-violet-50"
              onClick={handleScanClick}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
            <Button
              variant="outline"
              className="w-full border-indigo-200 hover:bg-indigo-50"
              onClick={() => setShowBankDialog(true)}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Bank Transfer / IBAN
            </Button>
          </CardContent>
        </MotionCard>

        <MotionCard variants={itemVariants} className="hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
                <ArrowDownLeft className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Receive Money</CardTitle>
                <CardDescription>Your username for transfers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share your username:</p>
              <div className="flex items-center justify-between gap-4">
                <p className="text-xl font-bold text-violet-600">@{user?.username || 'loading...'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQRDialog(true);
                    if (!qrToken) loadQRToken();
                  }}
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Show QR Code
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Others can send you money using this username or by scanning your QR code
            </p>
          </CardContent>
        </MotionCard>
      </div>

      <MotionCard variants={itemVariants}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-violet-600" />
            <CardTitle>Recent Transfers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No transfers yet</p>
              <p className="text-sm">Start sending money to your friends!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((transfer: any) => {
                const isSent = transfer.transaction_type === 'transfer_sent' || 
                               (transfer.transaction_type === 'transfer' && transfer.user_id === transfer.sender_id) ||
                               (transfer.transaction_type === 'transfer' && transfer.amount < 0);
                
                let counterparty = `user_${isSent ? transfer.receiver_id : transfer.sender_id}`;
                if (transfer.description) {
                  counterparty = transfer.description
                    .replace('Transfer to ', '')
                    .replace('Transfer from ', '')
                    .replace(' [HISTORICAL_GEN_2025]', '');
                }
                
                return (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        isSent 
                          ? 'bg-red-100 dark:bg-red-900' 
                          : 'bg-green-100 dark:bg-green-900'
                      }`}>
                        {isSent ? (
                          <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isSent ? 'Sent to' : 'Received from'}{' '}
                          <span className="text-violet-600">@{counterparty}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${
                      isSent ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {isSent ? '-' : '+'}{formatCurrency(Math.abs(transfer.amount), selectedCurrency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </MotionCard>

      {scheduledTransfers.length > 0 && (
        <MotionCard variants={itemVariants}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-amber-600" />
              <CardTitle>Scheduled Transfers</CardTitle>
            </div>
            <CardDescription>Transfers scheduled for future dates (visual demo only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                      <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        To <span className="text-violet-600">@{transfer.recipient}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Scheduled for {new Date(transfer.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-amber-700 dark:text-amber-500">
                      {formatCurrency(transfer.amount, selectedCurrency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setScheduledTransfers(scheduledTransfers.filter(t => t.id !== transfer.id));
                        toast.success('Scheduled transfer cancelled');
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </MotionCard>
      )}

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Username</Label>
              <Input
                id="recipient"
                placeholder="@username"
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-transfer"
                  checked={isScheduled}
                  onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                />
                <label
                  htmlFor="schedule-transfer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule this transfer
                </label>
              </div>

              {isScheduled && (
                <div className="space-y-2 bg-violet-50 dark:bg-violet-950 p-4 rounded-lg">
                  <Label htmlFor="scheduled-date">Select Date</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Demo feature - not processed by backend
                  </p>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
              onClick={handleSendMoney}
              disabled={transferMutation.isPending || !recipientUsername || !amount || Number(amount) <= 0}
            >
              {transferMutation.isPending 
                ? 'Sending...' 
                : isScheduled 
                ? 'Schedule Transfer' 
                : 'Send Money'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={(open) => {
        setShowQRDialog(open);
        if (open && !qrToken) {
          loadQRToken();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Payment QR Code</DialogTitle>
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
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                @{user?.username}
              </p>
              <p className="text-xs text-gray-500">
                Scan this code to send money to this user
              </p>
              <p className="text-xs text-amber-600 mt-2">
                ⏱️ Code expires in 5 minutes
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQRToken}
              className="mt-2"
            >
              Refresh Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scannerDialogOpen} onOpenChange={(open) => {
        if (!open && isScanning) {
          stopQRScanner();
        }
        setScannerDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              id="qr-reader" 
              ref={scannerRef}
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: '300px' }}
            />
            <p className="text-sm text-center text-gray-500">
              Point your camera at a UniPay QR code to scan
            </p>
            <Button
              variant="outline"
              onClick={() => stopQRScanner()}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bank Transfer / IBAN Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use these details to send money via bank transfer or IBAN
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
                    <p className="text-xs text-gray-500 mb-1">IBAN</p>
                    <p className="font-medium font-mono text-sm">{bankDetails.iban}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankDetails.iban, 'IBAN')}
                  >
                    {copiedField === 'IBAN' ? (
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
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Note:</strong> Bank transfers may take 1-2 business days to process. For instant transfers, use the QR code or username methods.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
