import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Package, DollarSign, Calendar, Tag } from 'lucide-react';
import SellerProfileCard from './SellerProfileCard';
import EscrowStatusBadge from './EscrowStatusBadge';

interface ListingDetailModalProps {
  listing: any;
  seller: any;
  open: boolean;
  onClose: () => void;
  onBuy: () => void;
  isBuying?: boolean;
}

export default function ListingDetailModal({
  listing,
  seller,
  open,
  onClose,
  onBuy,
  isBuying = false,
}: ListingDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">{listing.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <div className="aspect-[2/1] max-h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-violet-600">${listing.price}</p>
                <p className="text-sm text-gray-500 mt-1">Price in USD</p>
              </div>
              <EscrowStatusBadge status="available" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                <Tag className="h-3 w-3 mr-1" />
                {listing.category}
              </Badge>
              {listing.condition && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Package className="h-3 w-3 mr-1" />
                  {listing.condition}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Calendar className="h-3 w-3 mr-1" />
                Posted {new Date(listing.created_at).toLocaleDateString()}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {(listing.university || listing.faculty || listing.course) && (
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-3">Academic Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {listing.university && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">University</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.university}</p>
                    </div>
                  )}
                  {listing.faculty && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Faculty</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.faculty}</p>
                    </div>
                  )}
                  {listing.course && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Course</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.course}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-3">Seller Information</h3>
              <SellerProfileCard seller={seller} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Escrow Protection</h4>
                  <p className="text-sm text-blue-700">
                    Your payment is held securely until the seller delivers the item.
                    Funds are only released after you confirm receipt.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={onBuy}
                disabled={isBuying || !listing.is_available}
                className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 text-base"
              >
                {isBuying ? 'Processing...' : listing.is_available ? 'Buy Now with Escrow' : 'Sold Out'}
              </Button>
              <Button variant="outline" onClick={onClose} className="h-12">
                Close
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
