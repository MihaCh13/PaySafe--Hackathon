import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Calendar, GraduationCap, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface ISICProfile {
  id: number;
  isic_number: string;
  student_name: string;
  university: string;
  expiry_date: string;
  is_verified: boolean;
  is_expired: boolean;
  qr_code_data: string;
}

interface ISICCardFullProps {
  profile: ISICProfile;
}

export default function ISICCardFull({ profile }: ISICCardFullProps) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -10 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <CardContent className="p-0">
          <div className="relative h-56 p-6 text-white">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {profile.is_verified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium"
                >
                  <Shield className="h-3 w-3" />
                  Verified
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm opacity-90">International Student</p>
                <p className="text-lg font-bold">Identity Card</p>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 opacity-70" />
                <p className="text-lg font-semibold">{profile.student_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 opacity-70" />
                <p className="text-sm opacity-90">{profile.university}</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">Card Number</p>
                <p className="font-mono font-semibold text-sm">{profile.isic_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 uppercase tracking-wider">Valid Until</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <p className="font-mono font-semibold text-sm">
                    {new Date(profile.expiry_date).toLocaleDateString('en-US', {
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">Show this QR code at partner merchants</p>
              <p className="text-sm font-semibold text-gray-900">
                {profile.is_expired ? (
                  <span className="text-red-600">Card Expired</span>
                ) : (
                  <span className="text-green-600">Valid for Discounts</span>
                )}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200"
            >
              <div className="text-center">
                <QrCode className="h-16 w-16 text-gray-700 mx-auto" />
                <p className="text-[8px] text-gray-500 mt-1">Scan Me</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
