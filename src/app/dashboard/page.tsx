'use client';

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, isAfter, isBefore, isEqual } from 'date-fns';
import {
  Calendar,
  ListFilter,
  Loader2,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventCard from '@/components/event-card';
import { useCollection } from '@/supabase';
import type { Event } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { formatDate } from '@/lib/utils';

const allCategories = ['Tech', 'Music', 'Sports', 'Art', 'Cultural', 'Career'];

export default function Dashboard() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 20),
  });

  const { data: allEvents, isLoading: isLoadingEvents, error: eventsError } = useCollection<Event>('events', {
    orderBy: { column: 'date', ascending: true }
  });

  const handleCategoryFilterChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(cat => cat !== category) : [...prev, category]
    );
  };

  const filteredEvents = useMemo(() => {
    const upcomingEvents = allEvents?.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= new Date() && !(e as any).is_completed;
    });
    return upcomingEvents?.filter(event => {
      const categoryMatch = selectedCategories.length === 0 || (event.category && selectedCategories.includes(event.category));
      const club = (event as any).clubName || (event as any).club || '';
      const searchMatch = searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase()) || club.toLowerCase().includes(searchTerm.toLowerCase());

      const eventDate = new Date(event.date);
      const dateMatch = dateRange?.from
        ? (isAfter(eventDate, dateRange.from) || isEqual(eventDate, dateRange.from)) &&
          (dateRange.to ? (isBefore(eventDate, dateRange.to) || isEqual(eventDate, dateRange.to)) : true)
        : true;

      return categoryMatch && searchMatch && dateMatch;
    });
  }, [allEvents, selectedCategories, searchTerm, dateRange]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Upcoming Events</h1>
         <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events or clubs..."
            className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[320px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
               <DropdownMenuSeparator />
               {allCategories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryFilterChange(category)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {category}
                </DropdownMenuCheckboxItem>
               ))}
            </DropdownMenuContent>
          </DropdownMenu>
           <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                   {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from.toISOString())} - {formatDate(dateRange.to.toISOString())}
                      </>
                    ) : (
                      formatDate(dateRange.from.toISOString())
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isLoadingEvents && <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}
      {eventsError && (
        <Alert variant="destructive">
            <AlertTitle>Error loading events</AlertTitle>
            <AlertDescription>{eventsError.message}</AlertDescription>
        </Alert>
      )}
      {!isLoadingEvents && !eventsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents && filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">No upcoming events found matching your criteria.</p>
          )}
        </div>
      )}
    </>
  );
}
