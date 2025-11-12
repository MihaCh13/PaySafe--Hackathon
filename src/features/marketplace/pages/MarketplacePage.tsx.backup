import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Store, Plus, Search, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const MotionCard = motion(Card);

export default function MarketplacePage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('books');
  const [price, setPrice] = useState('');
  const [buyingListingIds, setBuyingListingIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: listingsData } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: async () => {
      const response = await marketplaceAPI.getListings();
      return response.data;
    },
  });

  const createListingMutation = useMutation({
    mutationFn: (data: any) => marketplaceAPI.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      setCreateDialogOpen(false);
      toast.success('Listing created successfully');
      setTitle('');
      setDescription('');
      setPrice('');
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
      toast.success('Order created! Seller will be notified.');
      setBuyingListingIds(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
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
          <h1 className="text-2xl font-bold text-gray-900">Student Marketplace</h1>
          <p className="text-gray-600 mt-1">Buy and sell items within your university community</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Marketplace Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Calculus Textbook"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brand new, never used"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border rounded-md"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="books">Books</option>
                  <option value="notes">Notes</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="25"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => createListingMutation.mutate({
                  title,
                  description,
                  category,
                  price: Number(price),
                })}
                disabled={createListingMutation.isPending || !title || !price || Number(price) <= 0}
              >
                {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for books, notes, gadgets..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {listingsData && listingsData.listings && listingsData.listings.length > 0 ? (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listingsData.listings.map((listing: any) => (
            <MotionCard
              key={listing.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="border-0 shadow-sm cursor-pointer overflow-hidden"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-gray-400" />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-lg font-bold text-violet-600">${listing.price}</p>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{listing.category}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                  onClick={() => createOrderMutation.mutate(listing.id)}
                  disabled={buyingListingIds.has(listing.id)}
                >
                  {buyingListingIds.has(listing.id) ? 'Processing...' : 'Buy Now'}
                </Button>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Store className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">Be the first to sell something in the marketplace</p>
              <Button
                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
