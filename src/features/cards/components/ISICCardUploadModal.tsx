import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { extractISICFields, preprocessImage, terminateOCRWorker, type ISICCardData, type OCRProgress } from '../utils/ocrProcessor';
import { ISICCardFields } from './ISICCardFields';
import { motion, AnimatePresence } from 'framer-motion';

interface ISICCardUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
}

type UploadStep = 'upload' | 'processing' | 'review' | 'complete';

export function ISICCardUploadModal({ isOpen, onClose, cardId }: ISICCardUploadModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<UploadStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ISICCardData | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [uploadToServer, setUploadToServer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Image must be under 5MB'
      });
      return;
    }

    setUploadedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setError(null);

    await processImage(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const processImage = async (file: File) => {
    try {
      setStep('processing');
      setError(null);

      const processed = await preprocessImage(file);
      const processedFile = new File([processed], file.name, { type: 'image/png' });

      const data = await extractISICFields(processedFile, (progress) => {
        setOcrProgress(progress);
      });

      setExtractedData(data);
      setStep('review');

      if (data.confidence < 60) {
        toast.warning('Low confidence detection', {
          description: 'Please review and correct the extracted fields carefully.'
        });
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setError('Could not read card. Please try a clearer image.');
      setStep('upload');
      toast.error('OCR failed', {
        description: 'Could not extract card data. Please try again with a clearer image.'
      });
    }
  };

  const handleFieldsSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (uploadToServer) {
        let screenshotBase64 = null;
        if (uploadedFile) {
          const reader = new FileReader();
          screenshotBase64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(uploadedFile);
          });
        }

        const response = await fetch('/api/isic/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            virtualCardId: cardId,
            cardData: data,
            uploadScreenshot: true,
            screenshotBase64
          })
        });

        if (!response.ok) {
          throw new Error('Failed to upload card data');
        }

        toast.success('ISIC card linked successfully!', {
          description: 'Your card data has been saved to your account.'
        });
        
        // Invalidate the query to refresh the uploaded card view
        queryClient.invalidateQueries({ queryKey: ['isic-uploaded-card'] });
      } else {
        toast.success('Card data extracted!', {
          description: 'Data processed on-device only (not uploaded).'
        });
      }

      setStep('complete');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save', {
        description: 'Could not save card data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setUploadedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setOcrProgress(null);
    setUploadToServer(false);
    setError(null);
    terminateOCRWorker();
    onClose();
  };

  const handleRetry = () => {
    setStep('upload');
    setError(null);
    setExtractedData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload ISIC Card Screenshot</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your ISIC card to link it with your virtual card
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-violet-400'}
                  ${error ? 'border-red-300 bg-red-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  {previewUrl ? (
                    <div className="relative w-full max-w-md">
                      <img
                        src={previewUrl}
                        alt="Card preview"
                        className="rounded-lg shadow-md max-h-64 object-contain mx-auto"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(null);
                          setUploadedFile(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                        {error ? (
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        ) : (
                          <Upload className="w-8 h-8 text-violet-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          {isDragActive ? 'Drop your image here' : 'Drag & drop your ISIC card screenshot'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse (PNG, JPG, WEBP - max 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Privacy-First Processing
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  All image processing happens on your device. Your card image is never sent to our servers unless you explicitly choose to upload it.
                </p>
              </div>

              {previewUrl && (
                <Button onClick={() => processImage(uploadedFile!)} className="w-full">
                  Process Card
                </Button>
              )}
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-8"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-violet-600 animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Processing your card...</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {ocrProgress?.status || 'Analyzing card data'}
                  </p>
                </div>
              </div>

              {ocrProgress && ocrProgress.progress > 0 && (
                <div className="space-y-2">
                  <Progress value={ocrProgress.progress * 100} className="h-2" />
                  <p className="text-center text-sm text-gray-600">
                    {Math.round(ocrProgress.progress * 100)}%
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'review' && extractedData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-medium mb-4">Review Extracted Information</h3>
                <ISICCardFields
                  initialData={extractedData}
                  onSubmit={handleFieldsSubmit}
                  onCancel={handleRetry}
                  loading={loading}
                />
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Privacy Options</h4>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="uploadToServer"
                    checked={uploadToServer}
                    onCheckedChange={(checked) => setUploadToServer(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="uploadToServer" className="font-normal cursor-pointer">
                      Save to my account for faster verification
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload extracted data and screenshot to our servers for account verification and faster merchant approvals.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">ISIC Card Linked!</h3>
              <p className="text-gray-600 mt-2">
                Your card information has been {uploadToServer ? 'saved to your account' : 'processed successfully'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
