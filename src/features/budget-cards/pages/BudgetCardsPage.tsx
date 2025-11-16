import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Lock, Unlock, ArrowUpCircle, MinusCircle, Calendar, Pause, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useCurrencyStore, formatCurrency, convertToUSD } from '@/stores/currencyStore';
import { SubscriptionCardDetailDialog } from '../components/SubscriptionCardDetailDialog';
import { PaymentCardDetailDialog } from '../components/PaymentCardDetailDialog';
import { BudgetCardDetailDialog } from '../components/BudgetCardDetailDialog';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { AnimatedDiv } from '@/components/animations/AnimatedDiv';
import { MotionCard } from '@/components/animations/MotionCard';
import { fadeUp, listItem } from '@/lib/animations';
import { notifyBudgetCardPayment } from '@/utils/notifications';

export default function BudgetCardsPage() {
  const { selectedCurrency } = useCurrencyStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cardPurpose, setCardPurpose] = useState<'payment' | 'budget' | 'subscription'>('payment');
  const [cardName, setCardName] = useState('');
  const [category, setCategory] = useState('food');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [spendDialogOpen, setSpendDialogOpen] = useState(false);
  const [addSubscriptionDialogOpen, setAddSubscriptionDialogOpen] = useState(false);
  const [subscriptionDetailOpen, setSubscriptionDetailOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [budgetDetailOpen, setBudgetDetailOpen] = useState(false);
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    service_name: '',
    service_category: 'streaming',
    amount: '',
    billing_cycle: 'monthly',
    next_billing_date: '',
  });
  const queryClient = useQueryClient();

  // Fetch all cards
  const { data: cardsData } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const response = await cardsAPI.getCards();
      return response.data;
    },
  });

  // Fetch categories for budget cards
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await cardsAPI.getCategories();
      return response.data.categories;
    },
  });

  // Fetch/create default payment cards on mount
  useQuery({
    queryKey: ['default-cards'],
    queryFn: async () => {
      const response = await cardsAPI.getDefaultCards();
      if (response.data.created && response.data.created.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['cards'] });
      }
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => cardsAPI.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setCreateDialogOpen(false);
      toast.success('Card created successfully');
      setCardName('');
      setSpendingLimit('');
    },
    onError: () => {
      toast.error('Failed to create card');
    },
  });

  const allocateMutation = useMutation({
    mutationFn: ({ cardId, amount }: { cardId: number; amount: number }) =>
      cardsAPI.allocateFunds(cardId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setAllocateDialogOpen(false);
      setAllocateAmount('');
      toast.success('Funds allocated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to allocate funds');
    },
  });

  const spendMutation = useMutation({
    mutationFn: ({ cardId, amount, description, cardName }: { cardId: number; amount: number; description?: string; cardName?: string }) =>
      cardsAPI.spendFromCard(cardId, amount, description),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setSpendDialogOpen(false);
      setSpendAmount('');
      toast.success('Expense recorded successfully');
      notifyBudgetCardPayment(variables.amount, variables.cardName || 'Budget Card', selectedCurrency);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record expense');
    },
  });

  const freezeMutation = useMutation({
    mutationFn: (cardId: number) => cardsAPI.freezeCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Card frozen');
    },
    onError: () => {
      toast.error('Failed to freeze card');
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (cardId: number) => cardsAPI.unfreezeCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Card unfrozen');
    },
    onError: () => {
      toast.error('Failed to unfreeze card');
    },
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: number; data: any }) =>
      cardsAPI.addSubscriptionToCard(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setAddSubscriptionDialogOpen(false);
      setSubscriptionFormData({
        service_name: '',
        service_category: 'streaming',
        amount: '',
        billing_cycle: 'monthly',
        next_billing_date: '',
      });
      toast.success('Subscription added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add subscription');
    },
  });

  const pauseSubscriptionMutation = useMutation({
    mutationFn: ({ cardId, subId }: { cardId: number; subId: number }) =>
      cardsAPI.pauseSubscription(cardId, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Subscription paused');
    },
    onError: () => {
      toast.error('Failed to pause subscription');
    },
  });

  const resumeSubscriptionMutation = useMutation({
    mutationFn: ({ cardId, subId }: { cardId: number; subId: number }) =>
      cardsAPI.resumeSubscription(cardId, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Subscription resumed');
    },
    onError: () => {
      toast.error('Failed to resume subscription');
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: ({ cardId, subId }: { cardId: number; subId: number }) =>
      cardsAPI.deleteSubscription(cardId, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Subscription deleted');
    },
    onError: () => {
      toast.error('Failed to delete subscription');
    },
  });

  const handleCreateCard = () => {
    if (cardPurpose === 'payment') {
      const limitInUSD = spendingLimit ? convertToUSD(Number(spendingLimit), selectedCurrency) : undefined;
      createMutation.mutate({
        card_purpose: 'payment',
        card_name: cardName || 'Virtual Card',
        card_type: 'standard',
        spending_limit: limitInUSD,
      });
    } else if (cardPurpose === 'budget') {
      createMutation.mutate({
        card_purpose: 'budget',
        card_name: cardName || 'Budget Card',
        category: category,
      });
    } else {
      createMutation.mutate({
        card_purpose: 'subscription',
        card_name: cardName || 'My Subscriptions',
        category: 'subscriptions',
      });
    }
  };

  const handleAddSubscription = () => {
    if (selectedCardId && subscriptionFormData.service_name && subscriptionFormData.amount) {
      const amountInUSD = convertToUSD(Number(subscriptionFormData.amount), selectedCurrency);
      addSubscriptionMutation.mutate({
        cardId: selectedCardId,
        data: {
          service_name: subscriptionFormData.service_name,
          service_category: subscriptionFormData.service_category,
          amount: amountInUSD,
          billing_cycle: subscriptionFormData.billing_cycle,
          next_billing_date: subscriptionFormData.next_billing_date || undefined,
        },
      });
    }
  };

  const handleAllocate = () => {
    if (selectedCardId && allocateAmount) {
      const amountInUSD = convertToUSD(Number(allocateAmount), selectedCurrency);
      allocateMutation.mutate({
        cardId: selectedCardId,
        amount: amountInUSD,
      });
    }
  };

  const handleSpend = () => {
    if (selectedCardId && spendAmount) {
      const amountInUSD = convertToUSD(Number(spendAmount), selectedCurrency);
      const selectedCard = cardsData?.cards?.find((card: any) => card.id === selectedCardId);
      spendMutation.mutate({
        cardId: selectedCardId,
        amount: amountInUSD,
        cardName: selectedCard?.card_name || 'Budget Card',
      });
    }
  };

  const paymentCards = cardsData?.cards?.filter((card: any) => card.card_purpose === 'payment') || [];
  const budgetCards = cardsData?.cards?.filter((card: any) => card.card_purpose === 'budget') || [];
  const subscriptionCards = cardsData?.cards?.filter((card: any) => card.card_purpose === 'subscription') || [];

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <AnimatedSection className="space-y-6 max-w-7xl mx-auto" stagger>
      <AnimatedDiv variants={fadeUp} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Cards</h1>
          <p className="text-gray-600 mt-1">Manage payment cards and budget trackers</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Card</DialogTitle>
              <DialogDescription>Choose between a payment card or budget tracker</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Card Type</Label>
                <RadioGroup value={cardPurpose} onValueChange={(value: any) => setCardPurpose(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="payment" id="payment" />
                    <Label htmlFor="payment" className="cursor-pointer">💳 Payment Card (Virtual debit/credit card)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="budget" id="budget" />
                    <Label htmlFor="budget" className="cursor-pointer">💰 Budget Card (Track spending by category)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="subscription" id="subscription" />
                    <Label htmlFor="subscription" className="cursor-pointer">📱 Subscription Card (Manage recurring subscriptions)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="cardName">Card Name</Label>
                <Input
                  id="cardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder={cardPurpose === 'payment' ? 'My Virtual Card' : 'Monthly Groceries'}
                />
              </div>
              {cardPurpose === 'payment' && (
                <div>
                  <Label htmlFor="spendingLimit">Spending Limit (Optional)</Label>
                  <Input
                    id="spendingLimit"
                    type="number"
                    value={spendingLimit}
                    onChange={(e) => setSpendingLimit(e.target.value)}
                    placeholder="1000"
                  />
                </div>
              )}
              {cardPurpose === 'budget' && (
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.map((cat: any) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreateCard} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Card'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AnimatedDiv>

      {/* Summary */}
      {budgetCards.length > 0 && (
        <AnimatedDiv variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MotionCard variants={listItem}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Allocated</p>
              <p className="text-2xl font-bold text-violet-600">
                {formatCurrency(cardsData?.summary?.total_allocated || 0, selectedCurrency)}
              </p>
            </CardContent>
          </MotionCard>
          <MotionCard variants={listItem}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(cardsData?.summary?.total_spent || 0, selectedCurrency)}
              </p>
            </CardContent>
          </MotionCard>
          <MotionCard variants={listItem}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(cardsData?.summary?.total_remaining || 0, selectedCurrency)}
              </p>
            </CardContent>
          </MotionCard>
        </AnimatedDiv>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({cardsData?.cards?.length || 0})</TabsTrigger>
          <TabsTrigger value="payment">Payment ({paymentCards.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetCards.length})</TabsTrigger>
          <TabsTrigger value="subscription">Subscriptions ({subscriptionCards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <AnimatedDiv variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsData?.cards?.map((card: any, index: number) => (
              <MotionCard
                key={card.id}
                variants={listItem}
                custom={index}
                className="overflow-hidden border-2"
                style={{ borderColor: card.card_purpose === 'budget' ? card.color : '#e5e7eb' }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {card.card_purpose === 'payment' ? 'Payment Card' : 
                         card.card_purpose === 'budget' ? 'Budget Card' : 
                         'Subscription Card'}
                      </p>
                      <h3 className="font-semibold text-lg">{card.card_name}</h3>
                    </div>
                    {(card.card_purpose === 'budget' || card.card_purpose === 'subscription') && (
                      <span className="text-2xl">{card.icon}</span>
                    )}
                  </div>

                  {card.card_purpose === 'payment' ? (
                    <>
                      <p className="text-gray-600 mb-4">**** **** **** {card.card_number_last4}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setPaymentDetailOpen(true);
                          }}
                          className="flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant={card.is_frozen ? 'default' : 'secondary'}
                          onClick={() =>
                            card.is_frozen ? unfreezeMutation.mutate(card.id) : freezeMutation.mutate(card.id)
                          }
                        >
                          {card.is_frozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      </div>
                    </>
                  ) : card.card_purpose === 'budget' ? (
                    <>
                      <div className="space-y-4 mb-4">
                        {/* Symmetrical Layout: Initial Budget (Left) vs Remaining Balance (Right) */}
                        <div className="flex justify-between items-center gap-4">
                          {/* Left: Initial Budget Loaded */}
                          <div className="flex-1 text-left">
                            <div className="text-xs text-gray-500 font-medium mb-1">Budget Loaded</div>
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(card.allocated_amount || 0, selectedCurrency)}
                            </div>
                          </div>
                          
                          {/* Right: Remaining Balance - Emphasized */}
                          <div className="flex-1 text-right">
                            <div className="text-xs text-green-600 font-medium mb-1">Remaining Balance</div>
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(card.remaining_balance || 0, selectedCurrency)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Center: Amount Spent */}
                        <div className="text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-xs text-red-700 font-medium mb-1">Amount Spent</div>
                          <div className="text-lg font-semibold text-red-600">
                            {formatCurrency(card.spent_amount || 0, selectedCurrency)}
                          </div>
                        </div>
                        
                        {/* Thin Progress Bar - Optional Indicator */}
                        <div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-600 transition-all"
                              style={{ width: `${Math.min(card.spent_percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span className="font-medium text-gray-600">{card.spent_percentage?.toFixed(0)}% used</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setBudgetDetailOpen(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setAllocateDialogOpen(true);
                          }}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setSpendDialogOpen(true);
                          }}
                        >
                          <MinusCircle className="h-4 w-4 mr-1" />
                          Spend
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Active Subscriptions</span>
                          <span className="font-semibold">{card.subscription_count || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Total</span>
                          <span className="font-semibold text-violet-600">${card.total_monthly_spend?.toFixed(2) || '0.00'}</span>
                        </div>
                        {card.next_billing_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Next billing: {new Date(card.next_billing_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setSubscriptionDetailOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </>
                  )}
                </CardContent>
              </MotionCard>
            ))}
          </AnimatedDiv>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentCards.map((card: any) => (
              <MotionCard key={card.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment Card</p>
                      <h3 className="font-semibold text-lg">{card.card_name}</h3>
                    </div>
                    <CreditCard className="h-6 w-6 text-violet-600" />
                  </div>
                  <p className="text-gray-600 mb-4">**** **** **** {card.card_number_last4}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={card.is_frozen ? 'default' : 'secondary'}
                      onClick={() =>
                        card.is_frozen ? unfreezeMutation.mutate(card.id) : freezeMutation.mutate(card.id)
                      }
                    >
                      {card.is_frozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {card.is_frozen ? 'Unfreeze' : 'Freeze'}
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetCards.map((card: any) => (
              <MotionCard
                key={card.id}
                className="overflow-hidden border-2"
                style={{ borderColor: card.color }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">{card.category}</p>
                      <h3 className="font-semibold text-lg">{card.card_name}</h3>
                    </div>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <div className="space-y-4 mb-4">
                    {/* Symmetrical Layout: Initial Budget (Left) vs Remaining Balance (Right) */}
                    <div className="flex justify-between items-center gap-4">
                      {/* Left: Initial Budget Loaded */}
                      <div className="flex-1 text-left">
                        <div className="text-xs text-gray-500 font-medium mb-1">Budget Loaded</div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(card.allocated_amount || 0, selectedCurrency)}
                        </div>
                      </div>
                      
                      {/* Right: Remaining Balance - Emphasized */}
                      <div className="flex-1 text-right">
                        <div className="text-xs text-green-600 font-medium mb-1">Remaining Balance</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(card.remaining_balance || 0, selectedCurrency)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Center: Amount Spent */}
                    <div className="text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs text-red-700 font-medium mb-1">Amount Spent</div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency(card.spent_amount || 0, selectedCurrency)}
                      </div>
                    </div>
                    
                    {/* Thin Progress Bar - Optional Indicator */}
                    <div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-600 transition-all"
                          style={{ width: `${Math.min(card.spent_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span className="font-medium text-gray-600">{card.spent_percentage?.toFixed(0)}% used</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCardId(card.id);
                        setAllocateDialogOpen(true);
                      }}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-1" />
                      Add Funds
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCardId(card.id);
                        setSpendDialogOpen(true);
                      }}
                    >
                      <MinusCircle className="h-4 w-4 mr-1" />
                      Spend
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptionCards.map((card: any) => (
              <MotionCard
                key={card.id}
                className="overflow-hidden border-2 border-pink-200"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Subscription Manager</p>
                      <h3 className="font-semibold text-lg">{card.card_name}</h3>
                    </div>
                    <span className="text-2xl">{card.icon || '📱'}</span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
                      <span className="text-sm text-gray-600">Monthly Total</span>
                      <span className="text-lg font-bold text-violet-600">
                        ${card.total_monthly_spend?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    {card.subscriptions && card.subscriptions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-semibold">Active Subscriptions ({card.subscription_count})</p>
                        {card.subscriptions.map((sub: any) => (
                          <div key={sub.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">{sub.service_name}</p>
                                <p className="text-xs text-gray-500">{sub.service_category}</p>
                              </div>
                              <Badge variant={sub.is_active ? "default" : "secondary"}>
                                {sub.is_active ? 'Active' : 'Paused'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-violet-600">
                                ${sub.amount}/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    if (sub.is_active) {
                                      pauseSubscriptionMutation.mutate({ cardId: card.id, subId: sub.id });
                                    } else {
                                      resumeSubscriptionMutation.mutate({ cardId: card.id, subId: sub.id });
                                    }
                                  }}
                                >
                                  {sub.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm(`Delete ${sub.service_name} subscription?`)) {
                                      deleteSubscriptionMutation.mutate({ cardId: card.id, subId: sub.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {sub.next_billing_date && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next: {new Date(sub.next_billing_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No subscriptions yet</p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setSelectedCardId(card.id);
                      setSubscriptionDetailOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </MotionCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Allocate Funds Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Funds</DialogTitle>
            <DialogDescription>Transfer money from your wallet to this budget card</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="allocateAmount">Amount</Label>
              <Input
                id="allocateAmount"
                type="number"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <Button onClick={handleAllocate} className="w-full" disabled={allocateMutation.isPending}>
              {allocateMutation.isPending ? 'Allocating...' : 'Allocate Funds'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spend Dialog */}
      <Dialog open={spendDialogOpen} onOpenChange={setSpendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>Record spending from this budget card</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="spendAmount">Amount</Label>
              <Input
                id="spendAmount"
                type="number"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                placeholder="50.00"
              />
            </div>
            <Button onClick={handleSpend} className="w-full" disabled={spendMutation.isPending}>
              {spendMutation.isPending ? 'Recording...' : 'Record Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subscription Dialog */}
      <Dialog open={addSubscriptionDialogOpen} onOpenChange={setAddSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>Add a new recurring subscription to this card</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                value={subscriptionFormData.service_name}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, service_name: e.target.value })}
                placeholder="Netflix"
              />
            </div>
            <div>
              <Label htmlFor="serviceCategory">Category</Label>
              <Select
                value={subscriptionFormData.service_category}
                onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, service_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streaming">Streaming</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={subscriptionFormData.amount}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, amount: e.target.value })}
                placeholder="15.99"
              />
            </div>
            <div>
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select
                value={subscriptionFormData.billing_cycle}
                onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, billing_cycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nextBillingDate">Next Billing Date (Optional)</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={subscriptionFormData.next_billing_date}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, next_billing_date: e.target.value })}
              />
            </div>
            <Button onClick={handleAddSubscription} className="w-full" disabled={addSubscriptionMutation.isPending}>
              {addSubscriptionMutation.isPending ? 'Adding...' : 'Add Subscription'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Detail Dialog */}
      {selectedCardId && (
        <SubscriptionCardDetailDialog
          open={subscriptionDetailOpen}
          onOpenChange={setSubscriptionDetailOpen}
          cardId={selectedCardId}
        />
      )}

      {/* Payment Card Detail Dialog */}
      {selectedCardId && (
        <PaymentCardDetailDialog
          open={paymentDetailOpen}
          onOpenChange={setPaymentDetailOpen}
          cardId={selectedCardId}
        />
      )}

      {/* Budget Card Detail Dialog */}
      {selectedCardId && (
        <BudgetCardDetailDialog
          open={budgetDetailOpen}
          onOpenChange={setBudgetDetailOpen}
          cardId={selectedCardId}
        />
      )}
    </AnimatedSection>
  );
}
