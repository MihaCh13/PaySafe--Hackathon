import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, Building2, BookOpen, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SellerProfileCardProps {
  seller: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    university: string;
    faculty?: string;
    email: string;
    created_at: string;
  };
  listingsCount?: number;
  rating?: number;
}

export default function SellerProfileCard({ seller, listingsCount = 0, rating }: SellerProfileCardProps) {
  const memberSince = new Date(seller.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {seller.first_name} {seller.last_name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">@{seller.username}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{seller.university}</span>
                </div>

                {seller.faculty && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{seller.faculty}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Member since {memberSince}</span>
                </div>

                {listingsCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{listingsCount} active listings</span>
                  </div>
                )}

                {rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">(Future enhancement)</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  Verified Student
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
