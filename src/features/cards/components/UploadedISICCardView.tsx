import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Clock, XCircle, Upload, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { isicAPI } from '@/lib/api';

interface UploadedCardData {
  id: number;
  card_number: string;
  full_name: string;
  date_of_birth: string;
  expiry_date: string;
  institution: string;
  card_type: 'physical' | 'digital';
  screenshot_url: string | null;
  screenshot_base64?: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface UploadedISICCardViewProps {
  onReupload: () => void;
}

export function UploadedISICCardView({ onReupload }: UploadedISICCardViewProps) {
  const [showScreenshot, setShowScreenshot] = useState(false);
  
  const { data: uploadedCard, isLoading } = useQuery<UploadedCardData>({
    queryKey: ['isic-uploaded-card'],
    queryFn: async () => {
      const response = await isicAPI.getUploadedCardMetadata();
      return response.data.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!uploadedCard) {
    return null;
  }

  const getStatusIcon = () => {
    switch (uploadedCard.verification_status) {
      case 'verified':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (uploadedCard.verification_status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Verification';
    }
  };

  const getStatusColor = () => {
    switch (uploadedCard.verification_status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Uploaded Card Information</h3>
            <p className="text-sm text-gray-600">
              Uploaded on {format(new Date(uploadedCard.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Card Number</p>
            <p className="text-sm font-medium text-gray-900">{uploadedCard.card_number}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Card Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{uploadedCard.card_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Full Name</p>
            <p className="text-sm font-medium text-gray-900">{uploadedCard.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Institution</p>
            <p className="text-sm font-medium text-gray-900">{uploadedCard.institution}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Date of Birth</p>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(uploadedCard.date_of_birth), 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Expiry Date</p>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(uploadedCard.expiry_date), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {uploadedCard.screenshot_url && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 uppercase mb-2">Screenshot</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Screenshot uploaded and stored securely
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          {uploadedCard.screenshot_url && (
            <Button 
              onClick={() => setShowScreenshot(true)} 
              variant="default" 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View ISIC Card
            </Button>
          )}
          <Button onClick={onReupload} variant="outline" size="sm" className="flex-1">
            <Upload className="w-4 h-4 mr-2" />
            Update Card Info
          </Button>
        </div>
      </CardContent>

      <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Your ISIC Card</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowScreenshot(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              View your uploaded ISIC card screenshot
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {uploadedCard.screenshot_base64 ? (
              <img
                src={uploadedCard.screenshot_base64}
                alt="ISIC Card Screenshot"
                className="w-full h-auto rounded-lg border shadow-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Screenshot not available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
