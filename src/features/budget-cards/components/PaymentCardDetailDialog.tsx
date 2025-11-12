import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cardsAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Copy, Eye, EyeOff, Calendar, Hash, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PaymentCardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
}

export function PaymentCardDetailDialog({
  open,
  onOpenChange,
  cardId,
}: PaymentCardDetailDialogProps) {
  const [showSensitive, setShowSensitive] = useState(false);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card-detail', cardId],
    queryFn: async () => {
      const response = await cardsAPI.getCard(cardId);
      return response.data.card;
    },
    enabled: open && !!cardId,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatCardNumber = (number: string) => {
    if (!number) return '';
    return number.match(/.{1,4}/g)?.join(' ') || number;
  };

  const maskCardNumber = (number: string) => {
    if (!number || number.length < 4) return '';
    return '•••• •••• •••• ' + number.slice(-4);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {card.card_name}
          </DialogTitle>
          <DialogDescription>
            Complete card details and banking information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-2">
          {/* Virtual Card Display */}
          <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white overflow-hidden relative">
            <CardContent className="pt-6 pb-8 px-6">
              {/* Card pattern background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-8 w-8" />
                    <div>
                      <div className="text-xs opacity-80">UniPay</div>
                      <div className="text-sm font-semibold capitalize">{card.card_type} Card</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className={card.is_frozen ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                    {card.is_frozen ? 'Frozen' : 'Active'}
                  </Badge>
                </div>

                {/* Card Number */}
                <div className="mb-6">
                  <div className="text-xs opacity-70 mb-1">Card Number</div>
                  <div className="text-xl font-mono tracking-wider">
                    {showSensitive ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}
                  </div>
                </div>

                {/* Card Details Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Expiry Date</div>
                    <div className="font-mono">
                      {card.expiry_date ? format(new Date(card.expiry_date), 'MM/yy') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70 mb-1">CVV</div>
                    <div className="font-mono">
                      {showSensitive ? card.cvv : '•••'}
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowSensitive(!showSensitive)}
                    >
                      {showSensitive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg">Banking Information</h3>
              <Separator />

              {/* IBAN */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Hash className="h-4 w-4" />
                    <span>IBAN</span>
                  </div>
                  <div className="font-mono text-sm">
                    {showSensitive ? card.iban : '••••••••••••••••••••'}
                  </div>
                </div>
                {showSensitive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(card.iban, 'IBAN')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* SWIFT/BIC */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Lock className="h-4 w-4" />
                    <span>SWIFT/BIC</span>
                  </div>
                  <div className="font-mono text-sm">
                    {showSensitive ? card.swift : '••••••••'}
                  </div>
                </div>
                {showSensitive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(card.swift, 'SWIFT/BIC')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Card Number (Full) */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span>Card Number</span>
                  </div>
                  <div className="font-mono text-sm">
                    {showSensitive ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}
                  </div>
                </div>
                {showSensitive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(card.card_number, 'Card number')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Expiry Date */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Expiry Date</span>
                  </div>
                  <div className="font-mono text-sm">
                    {card.expiry_date ? format(new Date(card.expiry_date), 'MMMM dd, yyyy') : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </div>
                  <div className="text-sm">
                    {card.created_at ? format(new Date(card.created_at), 'MMMM dd, yyyy \'at\' h:mm a') : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">Security Notice</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Keep your card details secure. Never share your card number, CVV, or PIN with anyone.
                    UniPay will never ask for these details via email or phone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
