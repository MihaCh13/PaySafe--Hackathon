import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void;
  isMobile?: boolean;
}

export default function AdvancedFilters({ onFilterChange, isMobile = false }: AdvancedFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);

  const contentTypes = [
    'Course Project',
    'Lecture Notes',
    'Lab Protocols',
    'Assignments',
    'Thesis',
    'Study Guides',
    'Past Papers',
    'Textbooks',
  ];

  const disciplines = [
    'Computer Science',
    'Engineering',
    'Business',
    'Medicine',
    'Law',
    'Arts',
    'Science',
    'Mathematics',
    'Economics',
    'Psychology',
  ];

  const faculties = [
    'Engineering Faculty',
    'Business School',
    'Medical School',
    'Law School',
    'Arts & Sciences',
    'Computer Science Dept',
    'Economics Dept',
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const applyFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      disciplines: selectedDisciplines,
      faculties: selectedFaculties,
      priceRange,
      condition: selectedCondition,
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedDisciplines([]);
    setSelectedFaculties([]);
    setPriceRange([0, 200]);
    setSelectedCondition([]);
    onFilterChange({});
  };

  const FilterContent = () => (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Content Type</h3>
          <div className="space-y-2">
            {contentTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`content-${type}`}
                  checked={selectedCategories.includes(type)}
                  onCheckedChange={() => toggleSelection(type, selectedCategories, setSelectedCategories)}
                />
                <Label htmlFor={`content-${type}`} className="text-sm font-normal cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Discipline</h3>
          <div className="space-y-2">
            {disciplines.map((discipline) => (
              <div key={discipline} className="flex items-center space-x-2">
                <Checkbox
                  id={`discipline-${discipline}`}
                  checked={selectedDisciplines.includes(discipline)}
                  onCheckedChange={() => toggleSelection(discipline, selectedDisciplines, setSelectedDisciplines)}
                />
                <Label htmlFor={`discipline-${discipline}`} className="text-sm font-normal cursor-pointer">
                  {discipline}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Faculty/Department</h3>
          <div className="space-y-2">
            {faculties.map((faculty) => (
              <div key={faculty} className="flex items-center space-x-2">
                <Checkbox
                  id={`faculty-${faculty}`}
                  checked={selectedFaculties.includes(faculty)}
                  onCheckedChange={() => toggleSelection(faculty, selectedFaculties, setSelectedFaculties)}
                />
                <Label htmlFor={`faculty-${faculty}`} className="text-sm font-normal cursor-pointer">
                  {faculty}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
          <div className="space-y-3">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Condition</h3>
          <div className="space-y-2">
            {conditions.map((cond) => (
              <div key={cond} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${cond}`}
                  checked={selectedCondition.includes(cond)}
                  onCheckedChange={() => toggleSelection(cond, selectedCondition, setSelectedCondition)}
                />
                <Label htmlFor={`condition-${cond}`} className="text-sm font-normal cursor-pointer">
                  {cond}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1 bg-violet-600">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Advanced Filters</SheetTitle>
          </SheetHeader>
          <FilterContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="border-0 shadow-sm h-fit sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-violet-600" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <FilterContent />
      </CardContent>
    </Card>
  );
}
