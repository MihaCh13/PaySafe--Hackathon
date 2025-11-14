import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceAPI, authAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Store, Plus, Search, ShoppingBag, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrencyStore, formatCurrency, convertToUSD } from '@/stores/currencyStore';
import AdvancedFilters from '../components/AdvancedFilters';
import ListingDetailModal from '../components/ListingDetailModal';
import CreateListingForm from '../components/CreateListingForm';
import EscrowStatusBadge from '../components/EscrowStatusBadge';

const MotionCard = motion.create(Card);

export default function EnhancedMarketplacePage() {
  const { selectedCurrency } = useCurrencyStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [buyingListingIds, setBuyingListingIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: async () => {
      const response = await marketplaceAPI.getListings();
      return response.data;
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await authAPI.getCurrentUser();
      return response.data;
    },
  });

  const createListingMutation = useMutation({
    mutationFn: (data: any) => marketplaceAPI.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      setCreateDialogOpen(false);
      toast.success('Listing created successfully!');
    },
    onError: () => {
      toast.error('Failed to create listing');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (listingId: number) => {
      setBuyingListingIds(prev => new Set(prev).add(listingId));
      return marketplaceAPI.createOrder(listingId);
    },
    onSuccess: (_data, listingId) => {
      toast.success('Order created! Payment held in escrow until delivery.');
      setBuyingListingIds(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
      setDetailModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
    onError: (_error, listingId) => {
      toast.error('Failed to create order');
      setBuyingListingIds(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    },
  });

  const handleViewDetails = (listing: any) => {
    setSelectedListing(listing);
    setDetailModalOpen(true);
  };

  const handleCreateListing = (data: any) => {
    const priceInUSD = convertToUSD(Number(data.price), selectedCurrency);
    createListingMutation.mutate({
      ...data,
      price: priceInUSD,
    });
  };

  const handleBuyListing = () => {
    if (selectedListing) {
      createOrderMutation.mutate(selectedListing.id);
    }
  };

  const filteredListings = listingsData?.listings?.filter((listing: any) => {
    // Apply search query filter
    if (searchQuery) {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(listing.category)) return false;
    }

    // Apply discipline filter (check if listing has discipline or similar field)
    if (filters.disciplines && filters.disciplines.length > 0) {
      // Disciplines aren't stored in listings, so skip this filter for now
    }

    // Apply faculty filter
    if (filters.faculties && filters.faculties.length > 0) {
      if (!listing.faculty || !filters.faculties.includes(listing.faculty)) return false;
    }

    // Apply price range filter
    if (filters.priceRange && filters.priceRange.length === 2) {
      const price = parseFloat(listing.price);
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
    }

    // Apply condition filter
    if (filters.condition && filters.condition.length > 0) {
      if (!listing.condition || !filters.condition.includes(listing.condition)) return false;
    }

    return true;
  }) || [];

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      <div className="hidden lg:block w-80 flex-shrink-0">
        <AdvancedFilters onFilterChange={setFilters} />
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="h-7 w-7 text-violet-600" />
              Student Marketplace
            </h1>
            <p className="text-gray-600 mt-1">
              Buy and sell academic materials with escrow protection
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" description="List an item for sale on the student marketplace">
              <DialogHeader>
                <DialogTitle>Create Marketplace Listing</DialogTitle>
              </DialogHeader>
              <CreateListingForm
                onSubmit={handleCreateListing}
                isLoading={createListingMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for course projects, notes, protocols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="lg:hidden">
                <AdvancedFilters onFilterChange={setFilters} isMobile />
              </div>
            </div>
          </CardContent>
        </Card>

        {listingsLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredListings.map((listing: any, index: number) => (
              <MotionCard
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="border-0 shadow-sm cursor-pointer overflow-hidden"
                onClick={() => handleViewDetails(listing)}
              >
                <div className="aspect-square bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 flex items-center justify-center relative">
                  <ShoppingBag className="h-20 w-20 text-violet-300" />
                  <div className="absolute top-2 right-2">
                    <EscrowStatusBadge status={listing.is_available ? 'available' : 'completed'} />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-bold text-violet-600">{formatCurrency(listing.price, selectedCurrency)}</p>
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                      {listing.category}
                    </span>
                  </div>
                  {(listing.university || listing.faculty) && (
                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                      {listing.university && <p>📚 {listing.university}</p>}
                      {listing.faculty && <p>🏛️ {listing.faculty}</p>}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(listing);
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </MotionCard>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Store className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No results found' : 'No listings yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to sell academic materials in the marketplace'
                }
              </p>
              {!searchQuery && (
                <Button
                  className="bg-gradient-to-r from-violet-600 to-indigo-600"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Listing
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          seller={selectedListing.seller || currentUser}
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onBuy={handleBuyListing}
          isBuying={buyingListingIds.has(selectedListing.id)}
        />
      )}
    </div>
  );
}
