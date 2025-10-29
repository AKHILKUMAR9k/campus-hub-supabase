'use client';

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth, useDoc } from '@/supabase';
import EventForm from "@/components/event-form";
import type { Event } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditEventPage() {
    const { id } = useParams();
    const eventId = Array.isArray(id) ? id[0] : id;
    const { user } = useAuth();

    const { data: event, isLoading, error } = useDoc<Event>('events', eventId);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Edit Event</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading event details...
                </CardContent>
            </Card>
        );
    }

    if (!isLoading && !event) {
        notFound();
    }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error loading event</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }
    
    const isOrganizer = user && event && (((event as any).created_by === user.id) || (event as any).organizerId === user.id);
    if (!isOrganizer) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Access denied</AlertTitle>
                <AlertDescription>You are not allowed to edit this event.</AlertDescription>
            </Alert>
        );
    }

    return (
        <EventForm existingEvent={event} />
    );
}
