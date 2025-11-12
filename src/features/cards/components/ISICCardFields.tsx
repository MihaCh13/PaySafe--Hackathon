import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ISICCardData } from '../utils/ocrProcessor';

const isicCardSchema = z.object({
  cardNumber: z.string()
    .min(5, 'Card number must be at least 5 characters')
    .max(20, 'Card number must be at most 20 characters')
    .regex(/^[A-Za-z0-9\s]+$/, 'Card number must contain only letters, numbers, and spaces'),
  fullName: z.string()
    .min(2, 'Name is required')
    .max(255, 'Name is too long')
    .regex(/^[A-Za-z\s]+$/, 'Name must contain only letters'),
  dateOfBirth: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date format')
    .refine((date) => {
      const d = new Date(date);
      const minDate = new Date('1950-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - 13);
      return d >= minDate && d <= maxDate;
    }, 'Date of birth must be between 1950 and 13 years ago'),
  expiryDate: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date format')
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Expiry date must be in the future'),
  institution: z.string()
    .min(2, 'Institution name is required')
    .max(255, 'Institution name is too long'),
  cardType: z.enum(['physical', 'digital'])
});

type ISICCardFormData = z.infer<typeof isicCardSchema>;

interface ISICCardFieldsProps {
  initialData: ISICCardData;
  onSubmit: (data: ISICCardFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ISICCardFields({ initialData, onSubmit, onCancel, loading }: ISICCardFieldsProps) {
  const [showConfidence, setShowConfidence] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<ISICCardFormData>({
    resolver: zodResolver(isicCardSchema),
    mode: 'onChange',
    defaultValues: {
      cardNumber: initialData.cardNumber,
      fullName: initialData.fullName,
      dateOfBirth: initialData.dateOfBirth,
      expiryDate: initialData.expiryDate,
      institution: initialData.institution,
      cardType: initialData.cardType
    }
  });

  const cardType = watch('cardType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {showConfidence && initialData.confidence < 80 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900">Low Confidence Detection</h4>
            <p className="text-sm text-yellow-700 mt-1">
              OCR confidence: {Math.round(initialData.confidence)}%. Please review and correct the fields below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowConfidence(false)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="cardNumber">
            ISIC Card Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cardNumber"
            {...register('cardNumber')}
            placeholder="ISIC 1234 5678 9012"
            maxLength={20}
            className={errors.cardNumber ? 'border-red-500' : ''}
          />
          {errors.cardNumber && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.cardNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardType">
            Card Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={cardType}
            onValueChange={(value) => setValue('cardType', value as 'physical' | 'digital', { shouldValidate: true })}
          >
            <SelectTrigger id="cardType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical Card</SelectItem>
              <SelectItem value="digital">Digital Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fullName"
          {...register('fullName')}
          placeholder="John Doe"
          className={errors.fullName ? 'border-red-500' : ''}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register('dateOfBirth')}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
            min="1950-01-01"
            className={errors.dateOfBirth ? 'border-red-500' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.dateOfBirth.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">
            Expiry Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="expiryDate"
            type="date"
            {...register('expiryDate')}
            min={new Date().toISOString().split('T')[0]}
            className={errors.expiryDate ? 'border-red-500' : ''}
          />
          {errors.expiryDate && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.expiryDate.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution">
          Institution/University <span className="text-red-500">*</span>
        </Label>
        <Input
          id="institution"
          {...register('institution')}
          placeholder="Sofia University"
          className={errors.institution ? 'border-red-500' : ''}
        />
        {errors.institution && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.institution.message}
          </p>
        )}
      </div>

      {isValid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">All fields are valid and ready to save!</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isValid || loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Save Card Information'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
