import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { eventCategories, eventStatuses } from "@shared/schema";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Schema for filter form
const filterSchema = z.object({
  status: z.string().optional(),
  categories: z.array(z.string()).optional(),
  location: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

interface FilterEventsFormProps {
  onFilterApplied: (filters: FilterValues) => void;
}

export default function FilterEventsForm({ onFilterApplied }: FilterEventsFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: undefined,
      categories: [],
      location: undefined,
      dateRange: {
        from: undefined,
        to: undefined,
      },
    },
  });

  const onSubmit = (data: FilterValues) => {
    // Include the selected categories
    const filters = {
      ...data,
      categories: selectedCategories,
    };
    onFilterApplied(filters);
  };

  const locations = [
    { value: "", label: "Todos os locais" },
    { value: "centro", label: "Centro de Convenções" },
    { value: "hotel", label: "Hotel Metropolitan" },
    { value: "expo", label: "Expo Center" },
    { value: "office", label: "Sala de Reuniões" },
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const resetForm = () => {
    form.reset();
    setSelectedCategories([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Range */}
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Período</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        {field.value?.from ? (
                          format(field.value.from, "P")
                        ) : (
                          <span>Data Inicial</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value?.from}
                      onSelect={(date) => field.onChange({
                        ...field.value,
                        from: date
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value?.to && "text-muted-foreground"
                        )}
                      >
                        {field.value?.to ? (
                          format(field.value.to, "P")
                        ) : (
                          <span>Data Final</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value?.to}
                      onSelect={(date) => field.onChange({
                        ...field.value,
                        to: date
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Todos
                    </FormLabel>
                  </FormItem>
                  {eventStatuses.map((status) => (
                    <FormItem key={status.value} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={status.value} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {status.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Categories */}
        <div className="space-y-3">
          <FormLabel>Categorias</FormLabel>
          <div className="mt-2 space-y-2">
            {eventCategories.map((category) => (
              <div key={category.value} className="flex items-start">
                <div className="flex items-center h-5">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor={`category-${category.value}`}
                    className="font-medium text-gray-700"
                  >
                    {category.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os locais" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
          >
            Limpar
          </Button>
          <Button type="submit">
            Aplicar Filtros
          </Button>
        </div>
      </form>
    </Form>
  );
}
