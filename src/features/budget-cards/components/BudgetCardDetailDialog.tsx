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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Copy, Eye, EyeOff, Calendar, Hash, Lock, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BudgetCardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number;
}

export function BudgetCardDetailDialog({
  open,
  onOpenChange,
  cardId,
}: BudgetCardDetailDialogProps) {
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
            Budget card details and banking information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 overflow-y-auto flex-1 pr-2">
          {/* Budget Card Display */}
          <Card 
            className="text-white overflow-hidden relative"
            style={{ 
              background: `linear-gradient(135deg, ${card.color || '#8b5cf6'} 0%, ${card.color || '#8b5cf6'}dd 100%)`
            }}
          >
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
                    <span className="text-4xl">{card.icon}</span>
                    <div>
                      <div className="text-xs opacity-80">UniPay Budget Card</div>
                      <div className="text-sm font-semibold capitalize">{card.category}</div>
                    </div>
                  </div>
                  <Wallet className="h-8 w-8 opacity-80" />
                </div>

                {/* Budget Overview */}
                <div className="mb-6">
                  <div className="text-xs opacity-70 mb-2">Budget Overview</div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs opacity-70">Allocated</div>
                      <div className="text-2xl font-bold">${card.allocated_amount?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70">Remaining</div>
                      <div className="text-2xl font-bold">${card.remaining_balance?.toFixed(2)}</div>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(card.spent_percentage || 0, 100)} 
                    className="h-2 bg-white/20"
                  />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="opacity-70">Spent: ${card.spent_amount?.toFixed(2)}</span>
                    <span className="font-semibold">{card.spent_percentage?.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Total Allocated</p>
                    <p className="text-lg font-bold">${card.allocated_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-100">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-lg font-bold">${card.spent_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Banking Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Banking Information</h3>
                <Button
                  size="sm"
                  variant="ghost"
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

              {card.last_reset_at && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Last Reset</span>
                    </div>
                    <div className="text-sm">
                      {format(new Date(card.last_reset_at), 'MMMM dd, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                </div>
              )}
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
                    Keep your banking details secure. This budget card can be used for transfers and payments.
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
