
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles, X, CheckCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { getSuggestedTags } from '@/app/actions';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useCollection, useDoc } from '@/supabase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { useAuth } from '@/supabase';
import type { Club, User, Event } from '@/lib/types';
import { uploadToStorage } from '@/supabase/utils';


const categories = ['Tech', 'Music', 'Sports', 'Art', 'Cultural', 'Career'];

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  longDescription: z.string().optional(),
  date: z.date({
    required_error: 'A date for the event is required.',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  venue: z.string().min(3, 'Venue is required.'),
  category: z.string({ required_error: 'Please select a category.' }),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  clubName: z.string().min(2, 'Club name is required.'),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
    existingEvent?: Event | null;
}

export default function EventForm({ existingEvent }: EventFormProps) {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: userProfile, isLoading: isUserLoading } = useDoc<User>('users', user?.id);

  const isOrganizer = userProfile?.role === 'club_organizer';

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: existingEvent ? {
        ...existingEvent,
        clubName: existingEvent.clubName || '',
        longDescription: existingEvent.longDescription || '',
        tags: existingEvent.tags || [],
        image: existingEvent.image || '',
        date: new Date(existingEvent.date),
    } : {
      title: '',
      description: '',
      longDescription: '',
      date: undefined,
      time: '10:00',
      venue: '',
      category: undefined,
      tags: [],
      image: '',
      clubName: '',
    },
  });
  
  useEffect(() => {
    if(existingEvent) {
        form.reset({
            ...existingEvent,
            clubName: existingEvent.clubName || '',
            longDescription: existingEvent.longDescription || '',
            tags: existingEvent.tags || [],
            image: existingEvent.image || '',
            date: new Date(existingEvent.date),
        });
        if (existingEvent.image) {
          const isDataUri = existingEvent.image.startsWith('data:image');
          setImagePreview(isDataUri ? existingEvent.image : null);
        }
    }
  }, [existingEvent, form]);


  const descriptionValue = useWatch({ control: form.control, name: 'description' });

  async function onSubmit(data: EventFormValues) {
    if (!user) return;

    let imageUrl = data.image;
    // If image is a data URI, upload to storage and get public URL
    if (imageUrl && imageUrl.startsWith('data:')) {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const fileExt = (blob.type.split('/')[1] || 'jpg').toLowerCase();
      const filePath = `events/${user.id}/${Date.now()}.${fileExt}`;
      try {
        imageUrl = await uploadToStorage(blob, filePath, 'event-images');
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Image Upload Failed',
          description: e?.message || 'Could not upload image. Please try again.',
        });
        return;
      }
    }

    const eventData = {
        // existing camelCase fields (kept for UI consumption)
        ...data,
        image: imageUrl || '',
        date: data.date.toISOString(),
        isPast: data.date < new Date(),
        organizerId: user.id,
        createdAt: new Date().toISOString(),
        // snake_case fields for DB schema alignment
        long_description: data.longDescription || null,
        club: data.clubName,
        image_url: imageUrl || null,
        created_by: user.id,
        is_completed: false,
    } as any;

    if (existingEvent) {
        // Update existing event
        await updateDocumentNonBlocking('events', eventData, existingEvent.id);
        toast({
            title: 'Event Updated!',
            description: 'Your event has been successfully updated.',
        });
        router.push(`/dashboard/events/${existingEvent.id}`);
    } else {
        // Create new event
        await addDocumentNonBlocking('events', {
            ...eventData,
            registrationCount: 0,
        });
        toast({
        title: 'Event Created!',
        description: 'Your event has been successfully created.',
        });
        form.reset();
        setSuggestedTags([]);
        router.push('/dashboard/manage-events');
    }
  }

  const handleSuggestTags = () => {
    startSuggestionTransition(async () => {
      if (!descriptionValue || descriptionValue.trim().length < 20) {
        toast({
          variant: 'destructive',
          title: 'Suggestion Failed',
          description: "Description must be at least 20 characters long.",
        });
        return;
      }
      const result = await getSuggestedTags(descriptionValue);
      if ('error' in result) {
        toast({
            variant: 'destructive',
            title: 'Suggestion Failed',
            description: result.error,
        });
        setSuggestedTags([]);
      } else {
        setSuggestedTags(result.tags);
      }
    });
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
     const currentTags = form.getValues('tags') || [];
     form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue('image', dataUri);
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isUserLoading) {
    return <Card><CardHeader><CardTitle>{existingEvent ? "Edit Event" : "Create a New Event"}</CardTitle></CardHeader><CardContent><Loader2 className="animate-spin" /> Loading form...</CardContent></Card>
  }

  if (!isOrganizer) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{existingEvent ? "Edit Event" : "Create a New Event"}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You must be a club organizer to create or edit events.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingEvent ? "Edit Event" : "Create a New Event"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Annual Tech Summit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tech Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Auditorium" {...field} />
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
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief summary of the event."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>This will be shown on event cards.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide all the details about the event here."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            !existingEvent && date < new Date(new Date().setDate(new Date().getDate() - 1))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSuggestTags}
                    disabled={isSuggesting || !descriptionValue || descriptionValue.trim().length < 20}
                >
                    {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Suggest Tags with AI
                </Button>
                {suggestedTags.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">AI Suggestions (click to add):</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => addTag(tag)}>{tag}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                     <div className="p-2 border rounded-md min-h-[40px]">
                        {field.value && field.value.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                                {field.value.map(tag => (
                                    <Badge key={tag} variant="default">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                            <X className="h-3 w-3 text-primary-foreground hover:text-white" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Add tags to improve discoverability.</p>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Poster</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                        {imagePreview ? (
                          <Image src={imagePreview} alt="Event poster preview" width={192} height={128} className="object-cover w-full h-full" />
                        ) : (
                          <div className="text-center text-muted-foreground p-2">
                            <Upload className="mx-auto h-8 w-8" />
                            <p className="text-xs mt-1">Image Preview</p>
                          </div>
                        )}
                      </div>
                      <Input id="picture" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <label htmlFor="picture" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload Image
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>Upload a custom image for your event poster. Recommended aspect ratio is 3:2.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
