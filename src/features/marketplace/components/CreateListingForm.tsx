import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Upload } from 'lucide-react';

interface CreateListingFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function CreateListingForm({ onSubmit, isLoading = false }: CreateListingFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Course Project',
    price: '',
    university: '',
    faculty: '',
    course: '',
    discipline: '',
    condition: 'New',
    isOneTimeOffer: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    'Course Project',
    'Lecture Notes',
    'Lab Protocols',
    'Assignments',
    'Thesis',
    'Study Guides',
    'Past Papers',
    'Textbooks',
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScrollArea className="h-[calc(80vh-180px)] border rounded-lg p-4">
        <div className="space-y-4 pr-4">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Data Structures Course Project"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-semibold">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category" className="text-sm font-semibold">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                className="w-full px-3 py-2 border rounded-md mt-1.5"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="price" className="text-sm font-semibold">
                Price ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="1"
                step="0.01"
                placeholder="25.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university" className="text-sm">University</Label>
                <Input
                  id="university"
                  placeholder="e.g., MIT"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="faculty" className="text-sm">Faculty/Department</Label>
                <Input
                  id="faculty"
                  placeholder="e.g., Computer Science"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="course" className="text-sm">Course Code/Name</Label>
                <Input
                  id="course"
                  placeholder="e.g., CS101"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="discipline" className="text-sm">Discipline</Label>
                <Input
                  id="discipline"
                  placeholder="e.g., Engineering"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <Label htmlFor="condition" className="text-sm font-semibold">Item Condition</Label>
            <select
              id="condition"
              className="w-full px-3 py-2 border rounded-md mt-1.5"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-violet-50 rounded-lg border border-violet-200">
            <Checkbox
              id="oneTimeOffer"
              checked={formData.isOneTimeOffer}
              onCheckedChange={(checked) => setFormData({ ...formData, isOneTimeOffer: checked as boolean })}
            />
            <div className="flex-1">
              <Label htmlFor="oneTimeOffer" className="cursor-pointer font-semibold text-gray-900">
                One-time offer
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically remove this listing after the first sale
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-400 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Upload images or files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              (File upload feature coming soon)
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || !formData.title || !formData.price || Number(formData.price) <= 0}
          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
        >
          {isLoading ? 'Creating...' : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
