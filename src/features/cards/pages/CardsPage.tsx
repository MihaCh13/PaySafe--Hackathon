import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ISICCardUploadModal } from '../components/ISICCardUploadModal';

const MotionCard = motion.create(Card);

export default function CardsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('standard');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [mutatingCardIds, setMutatingCardIds] = useState<Set<number>>(new Set());
  const [showISICUpload, setShowISICUpload] = useState(false);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: cardsData } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const response = await cardsAPI.getCards();
      return response.data.cards;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => cardsAPI.createCard(data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setCreateDialogOpen(false);
      toast.success('Card created successfully');
      setCardName('');
      setSpendingLimit('');
      
      if (response && response.card && response.card.id) {
        setNewCardId(response.card.id.toString());
        setShowISICUpload(true);
      }
    },
    onError: () => {
      toast.error('Failed to create card');
    },
  });

  const freezeMutation = useMutation({
    mutationFn: (cardId: number) => {
      setMutatingCardIds(prev => new Set(prev).add(cardId));
      return cardsAPI.freezeCard(cardId);
    },
    onSuccess: (_data, cardId) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Card frozen');
      setMutatingCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    },
    onError: (_error, cardId) => {
      toast.error('Failed to freeze card');
      setMutatingCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: (cardId: number) => {
      setMutatingCardIds(prev => new Set(prev).add(cardId));
      return cardsAPI.unfreezeCard(cardId);
    },
    onSuccess: (_data, cardId) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Card unfrozen');
      setMutatingCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    },
    onError: (_error, cardId) => {
      toast.error('Failed to unfreeze card');
      setMutatingCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    },
  });

  const getCardGradient = (cardType: string) => {
    switch (cardType) {
      case 'standard':
        return 'from-blue-600 to-violet-600'; // Blue/violet gradient
      case 'premium':
        return 'from-amber-500 to-yellow-500'; // Gold gradient
      case 'student':
        return 'from-green-600 to-emerald-600'; // Green gradient
      default:
        return 'from-violet-600 to-indigo-600';
    }
  };

  const handleCreateCard = () => {
    // Validate spending limit
    if (spendingLimit) {
      const limit = Number(spendingLimit);
      if (isNaN(limit) || limit <= 0) {
        toast.error('Spending limit must be a positive number');
        return;
      }
    }

    createMutation.mutate({
      card_name: cardName || 'Virtual Card',
      card_type: cardType,
      spending_limit: spendingLimit ? Number(spendingLimit) : undefined,
    });
  };

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
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>
          <p className="text-gray-600 mt-1">Manage your virtual cards and subscriptions</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Virtual Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Card Name</Label>
                <Input
                  id="card-name"
                  placeholder="My Shopping Card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-type">Card Type</Label>
                <select
                  id="card-type"
                  className="w-full px-3 py-2 border rounded-md"
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                >
                  <option value="standard">Standard (Blue/Violet)</option>
                  <option value="premium">Premium (Gold)</option>
                  <option value="student">Student (Green)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spending-limit">Spending Limit (optional)</Label>
                <Input
                  id="spending-limit"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="500"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                />
                <p className="text-xs text-gray-500">Leave blank for no limit. Must be a positive number.</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={handleCreateCard}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Card'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {cardsData && cardsData.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardsData.map((card: any) => (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className="perspective-1000"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                whileHover={{ rotateY: 180 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-full"
              >
                {/* Front Face */}
                <MotionCard 
                  className="border-0 shadow-md overflow-hidden absolute inset-0"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className={`bg-gradient-to-br ${getCardGradient(card.card_type)} p-6 text-white relative h-48`}>
                    {card.is_frozen && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                        <Lock className="h-12 w-12 text-white/90" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-white/80 text-sm">{card.card_name}</p>
                        <p className="text-xs text-white/60 mt-1 capitalize">{card.card_type}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-white/80" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono text-lg tracking-wider">
                        {card.card_number?.replace(/(\d{4})/g, '$1 ').trim() || '****  ****  ****'}
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Exp: {card.expiry_date || 'XX/XX'}</span>
                        {card.spending_limit && (
                          <span className="text-white/80 text-xs">Limit: ${card.spending_limit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex gap-2">
                      {card.is_frozen ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => unfreezeMutation.mutate(card.id)}
                          disabled={mutatingCardIds.has(card.id)}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          {mutatingCardIds.has(card.id) ? 'Unfreezing...' : 'Unfreeze'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => freezeMutation.mutate(card.id)}
                          disabled={mutatingCardIds.has(card.id)}
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          {mutatingCardIds.has(card.id) ? 'Freezing...' : 'Freeze'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </MotionCard>

                {/* Back Face */}
                <MotionCard 
                  className="border-0 shadow-md overflow-hidden absolute inset-0"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className={`bg-gradient-to-br ${getCardGradient(card.card_type)} p-6 text-white relative h-48`}>
                    <div className="h-12 bg-black/30 -mx-6 mb-6" />
                    <div className="space-y-4">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded">
                        <p className="text-xs text-white/70 mb-1">CVV</p>
                        <p className="font-mono text-2xl tracking-widest">{card.cvv || '***'}</p>
                      </div>
                      <div className="text-xs text-white/70">
                        <p>For online transactions</p>
                        <p className="mt-2">Keep this code secure</p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-6 text-white/50 text-xs">
                      <Lock className="h-4 w-4 inline mr-1" />
                      Secure Card
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 text-center">
                      Hover over to see front
                    </p>
                  </CardContent>
                </MotionCard>
              </motion.div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cards yet</h3>
              <p className="text-gray-600 mb-6">Create your first virtual card to get started</p>
              <Button
                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Card
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <ISICCardUploadModal
        isOpen={showISICUpload}
        onClose={() => setShowISICUpload(false)}
        cardId={newCardId || ''}
      />
    </motion.div>
  );
}
