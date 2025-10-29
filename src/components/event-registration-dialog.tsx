'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/supabase';
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import type { Event, User, Registration } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Loader2, Ticket, UserCheck, XCircle } from 'lucide-react';
import { sendEmail, generateRegistrationConfirmationEmail } from '@/lib/email-service';
import { formatDate, formatTime } from '@/lib/utils';
import { createReminder, getDefaultReminderTime } from '@/lib/reminder-service';

const registrationSchema = z.object({
  fullName: z.string().min(3, 'Full name is required.'),
  rollNumber: z.string().min(3, 'Roll number is required.'),
  branch: z.string().min(2, 'Branch is required.'),
  section: z.string().min(1, 'Section is required.'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface EventRegistrationDialogProps {
  event: Event;
  userProfile: User;
  isRegistered: boolean;
  registration: Registration | null;
}

export default function EventRegistrationDialog({ event, userProfile, isRegistered, registration }: EventRegistrationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: `${userProfile.first_name} ${userProfile.last_name}` || '',
      rollNumber: userProfile.rollNumber || '',
      branch: userProfile.branch || '',
      section: userProfile.section || '',
    },
  });
  
  useEffect(() => {
    form.reset({
      fullName: registration?.fullName || `${userProfile.first_name} ${userProfile.last_name}` || '',
      rollNumber: registration?.rollNumber || userProfile.rollNumber || '',
      branch: registration?.branch || userProfile.branch || '',
      section: registration?.section || userProfile.section || '',
    })
  }, [userProfile, registration, form]);

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!user?.id) return;

    const registrationData = {
      ...data,
      // legacy camelCase for compatibility in UI that reads it
      eventId: event.id,
      userId: user.id,
      email: userProfile.email,
      registrationDate: new Date().toISOString(),
      title: event.title,
      date: event.date,
      // new schema snake_case
      event_id: event.id as any,
      user_id: user.id,
      registered_at: new Date().toISOString(),
    } as any;

    try {
      // Create registration
      await addDocumentNonBlocking('registrations', registrationData);

      // Optionally update legacy counter if present
      if (typeof (event as any).registrationCount === 'number') {
        await updateDocumentNonBlocking('events', {
          registrationCount: ((event as any).registrationCount || 0) + 1
        }, event.id);
      }

      // Send confirmation email if user has email preferences enabled
      if (userProfile.email && userProfile.emailPreferences?.eventReminders !== false) {
        const emailData = generateRegistrationConfirmationEmail(
          event.title,
          formatDate(event.date),
          formatTime(event.time),
          event.venue
        );
        emailData.to = userProfile.email;

        try {
          await sendEmail(emailData);
        } catch (error) {
          console.error('Failed to send registration confirmation email:', error);
          // Don't show error to user, registration is still successful
        }
      }

      // Create automatic reminder (1 day before event)
      try {
        const reminderTime = getDefaultReminderTime(event.date, event.time);
        await createReminder(userProfile, event, reminderTime);
      } catch (error) {
        console.error('Failed to create reminder:', error);
        // Don't show error to user, registration is still successful
      }

      toast({
        title: 'Registration Successful!',
        description: `You are now registered for ${event.title}. A reminder has been set for 1 day before the event.`,
      });
      setIsOpen(false);
    } catch (error: any) {
       toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.message || "An error occurred.",
        });
    }
  };

  const handleUnregister = async () => {
    if (!user?.id || !registration) return;

    try {
        // Delete the registration
        await deleteDocumentNonBlocking('registrations', registration.id);

        // Optionally decrement legacy counter if present
        if (typeof (event as any).registrationCount === 'number') {
          await updateDocumentNonBlocking('events', {
            registrationCount: ((event as any).registrationCount || 1) - 1
          }, event.id);
        }

        toast({
            title: 'Unregistered Successfully',
            description: `You are no longer registered for ${event.title}.`,
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Unregistration Failed",
            description: error.message || "An error occurred.",
        });
    }
  }

  if (isRegistered) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="secondary">
                    <UserCheck className="mr-2" />
                    You are registered
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are already registered for "{event.title}". Would you like to cancel your registration?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnregister}>
                        <XCircle className="mr-2" />
                        Cancel Registration
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)}>
        <Ticket className="mr-2" />
        Register for this Event
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for: {event.title}</DialogTitle>
          <DialogDescription>
            Confirm your details to complete the registration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rollNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 21BCE0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CSE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Registration
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
