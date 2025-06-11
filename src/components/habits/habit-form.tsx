
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addHabitAction, updateHabitAction } from "@/app/(main)/actions";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Habit } from "@/types/habit";

const habitFormSchema = z.object({
  name: z.string().min(2, {
    message: "Habit name must be at least 2 characters.",
  }).max(50, { message: "Habit name must be at most 50 characters." }),
  description: z.string().max(200, { message: "Description must be at most 200 characters." }).optional(),
  frequency: z.enum(["daily", "weekly"]),
  targetDays: z.array(z.number().min(0).max(6)).optional(), 
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  onSuccess?: () => void;
  initialData?: Habit | null; // For editing
  habitIdToEdit?: string | null; // For editing
}

const daysOfWeek = [
  { id: 0, label: "Sunday" },
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
];

export function HabitForm({ onSuccess, initialData, habitIdToEdit }: HabitFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!habitIdToEdit && !!initialData;

  const defaultValues: Partial<HabitFormValues> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    frequency: initialData?.frequency || "daily",
    targetDays: initialData?.targetDays || [],
  };

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        frequency: initialData.frequency,
        targetDays: initialData.targetDays || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        frequency: "daily",
        targetDays: [],
      });
    }
  }, [initialData, form]);
  
  const frequency = form.watch("frequency");
  useEffect(() => {
    if (frequency === "daily") {
      form.setValue("targetDays", []);
    }
  }, [frequency, form]);


  async function onSubmit(data: HabitFormValues) {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const habitDataPayload = {
        ...data,
        description: data.description || "", // Ensure description is empty string if undefined
        targetDays: data.frequency === 'weekly' ? (data.targetDays || []) : [],
      };

      if (isEditing && habitIdToEdit) {
        await updateHabitAction(habitIdToEdit, user.uid, habitDataPayload);
        toast({ title: "Success", description: "Habit updated successfully!" });
      } else {
        await addHabitAction(user.uid, habitDataPayload);
        toast({ title: "Success", description: "Habit added successfully!" });
      }
      if (!isEditing) form.reset({ name: "", description: "", frequency: "daily", targetDays: [] }); // Reset only if adding
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || `Failed to ${isEditing ? 'update' : 'add'} habit.`, variant: "destructive" });
      console.error(`Failed to ${isEditing ? 'update' : 'add'} habit:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Morning Run, Read 30 mins" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief note about this habit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={initialData?.frequency || "daily"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("frequency") === "weekly" && (
           <FormField
            control={form.control}
            name="targetDays"
            render={() => (
              <FormItem>
                <FormLabel>Target Days</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 border rounded-md">
                  {daysOfWeek.map((day) => (
                    <FormField
                      key={day.id}
                      control={form.control}
                      name="targetDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.id}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, day.id])
                                    : field.onChange(
                                        currentValue.filter(
                                          (value) => value !== day.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                 <FormDescription>Select which days of the week this habit applies.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? "Update Habit" : "Add Habit"}
        </Button>
      </form>
    </Form>
  );
}

