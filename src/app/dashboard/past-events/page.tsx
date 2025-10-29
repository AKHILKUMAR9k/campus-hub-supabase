'use client';

import EventCard from "@/components/event-card";
import { useCollection } from "@/supabase";
import type { Event } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function PastEventsPage() {
   const { data: allEvents, isLoading, error } = useCollection<Event>('events', {
     orderBy: { column: 'date', ascending: false }
   });
   const pastEvents = (allEvents || []).filter(e => {
     const d = new Date(e.date);
     return d < new Date() || (e as any).is_completed === true;
   });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Past Events</h1>
      </div>
       {isLoading && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}
       {error && (
         <Alert variant="destructive">
             <AlertTitle>Error loading events</AlertTitle>
             <AlertDescription>{error.message}</AlertDescription>
         </Alert>
       )}
       {!isLoading && !error && (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pastEvents && pastEvents.length > 0 ? (
            pastEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <p>No past events found.</p>
          )}
        </div>
       )}
    </>
  );
}
