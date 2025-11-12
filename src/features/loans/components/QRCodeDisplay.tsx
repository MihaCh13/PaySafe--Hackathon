import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  loanData: {
    amount: number;
    reason: string;
    deadline: string | null;
  };
  onClose: () => void;
}

export default function QRCodeDisplay({ loanData, onClose }: QRCodeDisplayProps) {
  const qrData = btoa(JSON.stringify({
    type: 'loan_request',
    amount: loanData.amount,
    reason: loanData.reason,
    deadline: loanData.deadline,
    timestamp: new Date().toISOString(),
  }));

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `loan-request-${loanData.amount}.png`;
    link.click();
    toast.success('QR Code downloaded');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Loan Request',
          text: `Please lend me $${loanData.amount} for ${loanData.reason}`,
          url: qrCodeUrl,
        });
        toast.success('Shared successfully');
      } catch (error) {
        toast.error('Failed to share');
      }
    } else {
      navigator.clipboard.writeText(qrCodeUrl);
      toast.success('Link copied to clipboard');
    }
  };

  const colorClass = loanData.amount < 50 
    ? 'from-green-400 to-emerald-500'
    : loanData.amount < 150
    ? 'from-blue-400 to-indigo-500'
    : loanData.amount < 300
    ? 'from-orange-400 to-amber-500'
    : 'from-red-400 to-rose-500';

  return (
    <div className="space-y-4">
      <Card className={`border-4 bg-gradient-to-br ${colorClass} p-1`}>
        <CardContent className="p-6 bg-white rounded space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Scan to lend</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ${loanData.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">{loanData.reason}</p>
          </div>

          <div className="flex items-center justify-center p-4 bg-white rounded-lg">
            <img 
              src={qrCodeUrl} 
              alt="Loan Request QR Code"
              className="w-full max-w-xs"
            />
          </div>

          {loanData.deadline && (
            <p className="text-xs text-center text-gray-500">
              Repayment by: {new Date(loanData.deadline).toLocaleDateString()}
            </p>
          )}

          <p className="text-xs text-center text-gray-400">
            Valid for 24 hours • UniPay P2P Lending
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Close
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
