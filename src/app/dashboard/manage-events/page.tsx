'use client';

import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useAuth } from "@/supabase";
import type { Event } from "@/lib/types";
import { Loader2 } from "lucide-react";
import EventCard from "@/components/event-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ManageEventsPage() {
  const { user, isUserLoading } = useAuth();

  const { data: managedEvents, isLoading, error } = useCollection<Event>('events', {
    // Prefer new schema field created_by; fallback to legacy organizerId
    filters: { created_by: user?.id, organizerId: user?.id },
  });

  const isLoadingPage = isUserLoading || isLoading;

  return (
    <>
       <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Your Events</h1>
        <Button asChild>
            <Link href="/dashboard/create-event">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Event
            </Link>
        </Button>
      </div>

       {isLoadingPage && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}

       {error && (
         <Alert variant="destructive">
             <AlertTitle>Error loading your events</AlertTitle>
             <AlertDescription>{error.message}</AlertDescription>
         </Alert>
       )}

      {!isLoadingPage && !error && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {managedEvents && managedEvents.length > 0 ? (
            managedEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">You haven't created any events yet. Get started by creating a new event!</p>
              </CardContent>
            </Card>
          )}
        </div>
       )}
    </>
  );
}
