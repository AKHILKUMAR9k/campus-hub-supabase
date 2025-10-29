'use client';

import { useState } from 'react';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateGoogleCalendarUrl, downloadICalFile, createCalendarEvent } from '@/lib/calendar-utils';
import type { Event } from '@/lib/types';

interface AddToCalendarProps {
  event: Event;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function AddToCalendar({ event, variant = 'outline', size = 'sm' }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const calendarEvent = createCalendarEvent({
    title: event.title,
    description: event.description || `Join us for ${event.title} organized by ${event.clubName}`,
    venue: event.venue,
    date: event.date,
    time: event.time,
    duration: 2, // Default 2 hours
  });

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(calendarEvent);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleICalDownload = () => {
    downloadICalFile(calendarEvent);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Add to Calendar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleICalDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download iCal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
