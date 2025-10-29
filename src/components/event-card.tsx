import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Event } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDate, formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type EventCardProps = {
  event: Event;
};

export default function EventCard({ event }: EventCardProps) {
  const rawImage = (event as any).image_url || (event as any).image || '';
  const isDataUri = typeof rawImage === 'string' && rawImage.startsWith('data:image');
  const eventImage = !isDataUri ? PlaceHolderImages.find(img => img.id === rawImage) : null;
  const imageUrl = isDataUri ? rawImage : eventImage?.imageUrl || rawImage || undefined;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <Link href={`/dashboard/events/${event.id}`}>
            {imageUrl ? (
            <Image
                src={imageUrl}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={eventImage?.imageHint}
            />
            ) : <div className="w-full h-48 bg-muted" />}
        </Link>
        {event.category && <Badge variant="secondary" className="absolute top-2 right-2">{event.category}</Badge>}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start gap-3 mb-2">
           <div>
              <CardTitle className="text-lg font-headline mb-1 leading-tight">{event.title}</CardTitle>
              <CardDescription className="text-sm">{(event as any).clubName || (event as any).club}</CardDescription>
           </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)} at {formatTime((event as any).time)}</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.venue}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50">
        <div className="flex items-center w-full">
            <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{event.registrationCount ?? 0} going</span>
            </div>
             <Button asChild size="sm" className="ml-auto">
                <Link href={`/dashboard/events/${event.id}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
