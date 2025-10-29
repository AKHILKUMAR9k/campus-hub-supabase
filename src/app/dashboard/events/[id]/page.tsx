

'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection } from '@/supabase';
import type { Event, User, Registration } from '@/lib/types';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDate, formatTime } from '@/lib/utils';
import { Calendar, Edit, Loader2, MapPin, Trash, XCircle, Link as LinkIcon, Bell, CalendarPlus, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import EventComments from '@/components/event-comments';
import EventRegistrationDialog from '@/components/event-registration-dialog';
import { add, format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { sendEmail, generateReminderEmail } from '@/lib/email-service';
import { useAuth } from '@/supabase';
import AddToCalendar from '@/components/add-to-calendar';

function RegisteredStudents({ eventId }: { eventId: string }) {
    const { data: registrations, isLoading, error } = useCollection<Registration>('registrations', {
        // Prefer new schema snake_case
        filters: { event_id: eventId as any, eventId: eventId },
    });

    if (isLoading) {
        return <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertTitle>Could Not Load Registrations</AlertTitle><AlertDescription>You may not have permission to view this list, or there was a network error.</AlertDescription></Alert>;
    }

    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roll Number</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {registrations && registrations.length > 0 ? registrations.map(reg => (
                    <TableRow key={reg.id}>
                        <TableCell>{(reg as any).fullName || (reg as any).user_full_name || (reg as any).user_id}</TableCell>
                        <TableCell>{(reg as any).email || ''}</TableCell>
                        <TableCell>{(reg as any).rollNumber || ''}</TableCell>
                    </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No students have registered yet.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}


export default function EventDetailPage() {
  const { id } = useParams();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { toast } = useToast();
  const router = useRouter();

  const { user } = useAuth();

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useDoc<Event>('events', eventId);

  const { data: userProfile } = useDoc<User>('users', user?.id);

  const isOrganizer = user && event && ((event as any).created_by === user.id || event.organizerId === user.id);
  const isAdmin = userProfile?.role === 'admin';

  const { data: userRegistrations } = useCollection<Registration>('registrations', {
    filters: { user_id: user?.id as any, event_id: eventId as any, userId: user?.id, eventId: eventId }
  });
  const userRegistration = userRegistrations?.[0];
  const isUserRegistered = !!userRegistration;


  if (isLoadingEvent) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (eventError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{eventError.message}</AlertDescription>
      </Alert>
    );
  }



  if (!event) {
    return (
        <div className="flex justify-center items-center h-64">
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load event details. Please try again later.</AlertDescription>
            </Alert>
        </div>
    );
  }

  const handleDelete = async () => {
    if (!event) return;
    deleteDocumentNonBlocking('events', event.id);
    toast({
        title: "Event Deleted",
        description: `"${event.title}" has been successfully deleted.`,
    });
    router.replace('/dashboard');
  };

  const handleSetReminder = async () => {
    if (!user || !event || !userProfile) return;

    setDocumentNonBlocking('reminders', {
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      createdAt: new Date().toISOString(),
      reminderTime: new Date().toISOString(), // Add required reminderTime field
      sent: false,
    });

    // Send email reminder if user has email preferences enabled
    if (userProfile.email && userProfile.emailPreferences?.eventReminders !== false) {
      const emailData = generateReminderEmail(
        event.title,
        formatDate(event.date),
        formatTime(event.time)
      );
      emailData.to = userProfile.email;

      try {
        await sendEmail(emailData);
      } catch (error) {
        console.error('Failed to send reminder email:', error);
        // Don't show error to user, reminder is still set in database
      }
    }

    toast({
      title: "Reminder Set!",
      description: `We'll remind you about "${event.title}" from the notifications panel.`,
    });
  };


  const rawImage = (event as any).image_url || (event as any).image || '';
  const isDataUri = typeof rawImage === 'string' && rawImage.startsWith('data:image');
  const eventImage = !isDataUri ? PlaceHolderImages.find(img => img.id === rawImage) : null;
  const imageUrl = isDataUri ? rawImage : eventImage?.imageUrl || rawImage || undefined;
  
  const { data: registrationsCountData } = useCollection<Registration>('registrations', {
    filters: { event_id: eventId as any, eventId: eventId }
  });
  const totalRegistrations = (event as any).registrationCount ?? (registrationsCountData?.length || 0);
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={event.title}
            width={1200}
            height={400}
            className="w-full h-64 object-cover"
            data-ai-hint={eventImage?.imageHint}
            priority
          />
        )}
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
              {event.category && <Badge variant="secondary" className="mb-2">{event.category}</Badge>}
              <h1 className="text-3xl font-bold font-headline">{event.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
                {event.registrationLink && (
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                            Registration Link
                        </a>
                    </div>
                )}
              </div>
            </div>
            {event.clubName && (
               <div className="flex items-center gap-3 bg-muted p-3 rounded-lg shrink-0">
                <div>
                  <p className="font-semibold text-sm">Organized by</p>
                  <p className="text-foreground font-bold">{event.clubName}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-full">
            <p className="lead">{event.description}</p>
            {event.longDescription && <p>{event.longDescription}</p>}
          </div>

          <div className="flex flex-wrap gap-2 my-6">
            {event.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-bold text-foreground">{totalRegistrations}</span>
                <span>{totalRegistrations === 1 ? 'person is' : 'people are'} going</span>
              </div>

              {userProfile?.role === 'student' && !event.isPast && userProfile && (
                <div className="flex flex-wrap gap-2">
                    <EventRegistrationDialog
                        event={event}
                        userProfile={userProfile}
                        isRegistered={isUserRegistered}
                        registration={userRegistration || null}
                    />
                    <AddToCalendar event={event} />
                    <Button variant="outline" onClick={handleSetReminder}><Bell className="mr-2 h-4 w-4" /> Set Reminder</Button>
                </div>
              )}

               {(isOrganizer || isAdmin) && (
                 <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/events/${eventId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Event
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the event "{event.title}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
              )}
          </div>
        </CardContent>
      </Card>
      
       {(isOrganizer || isAdmin) && (
        <Card>
            <CardHeader>
                <CardTitle>Registrations ({totalRegistrations})</CardTitle>
                <CardDescription>
                  View the list of students who have registered for this event.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RegisteredStudents eventId={eventId!} />
            </CardContent>
        </Card>
      )}

      {event.isPast && userProfile?.role === 'student' && (
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold font-headline">Comments & Feedback</h2>
          </CardHeader>
          <CardContent>
            <EventComments eventId={eventId!} eventTitle={event.title} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
