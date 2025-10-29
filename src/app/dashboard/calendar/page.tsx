'use client';

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useCollection } from '@/supabase';
import type { Registration } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    eventId: string;
    clubName: string;
    venue: string;
    time: string;
  };
}

export default function CalendarView() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { data: registrations, isLoading, error } = useCollection<Registration>('registrations');

  const calendarEvents = useMemo(() => {
    if (!registrations) return [];

    return registrations.map(registration => ({
      id: registration.id,
      title: registration.title || 'Event',
      start: new Date(registration.date || ''),
      end: new Date(registration.date || ''),
      resource: {
        eventId: registration.eventId,
        clubName: registration.clubName || 'Unknown Club',
        venue: registration.venue || 'TBD',
        time: registration.time || 'TBD',
      },
    }));
  }, [registrations]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading calendar</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-headline">My Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-4">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              defaultView="month"
              popup
              selectable
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Event Details</h3>
            {selectedEvent ? (
              <div className="space-y-2">
                <h4 className="font-medium">{selectedEvent.title}</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Club:</strong> {selectedEvent.resource.clubName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {format(selectedEvent.start, 'PPP')}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time:</strong> {selectedEvent.resource.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Venue:</strong> {selectedEvent.resource.venue}
                </p>
                <Link
                  href={`/dashboard/events/${selectedEvent.resource.eventId}`}
                  className="inline-block mt-2 text-sm text-primary hover:underline"
                >
                  View Event Details →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click on an event to view details
              </p>
            )}
          </div>

          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-2">
              {calendarEvents
                .filter(event => event.start >= new Date())
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded border cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.start, 'MMM d, yyyy')} at {event.resource.time}
                    </p>
                  </div>
                ))}
              {calendarEvents.filter(event => event.start >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
