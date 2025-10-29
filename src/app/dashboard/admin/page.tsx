
'use client';
import { useState, useEffect } from 'react';
import { useCollection, useDoc, useAuth } from '@/supabase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/supabase/non-blocking-updates';
import type { User, Event, Club } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Loader2, MoreHorizontal, ShieldCheck, UserCheck, UserX, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function OrganizerRequests() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { data: requests, isLoading } = useCollection<User>('users', {
    filters: { role: 'club_organizer', organizerStatus: 'pending' }
  });

  const handleRequest = async (userId: string, newStatus: 'approved' | 'rejected') => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await setDocumentNonBlocking('users', { organizerStatus: newStatus }, userId);

      toast({
        title: `Request ${newStatus}`,
        description: `The organizer request has been successfully ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating request',
        description: error.message,
      });
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizer Requests</CardTitle>
        <CardDescription>
          Approve or reject requests from users wanting to become club organizers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests && requests.length > 0 ? (
                requests.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                      {loading[user.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-500" onClick={() => handleRequest(user.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRequest(user.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No pending requests</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ClubRequests() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { data: requests, isLoading } = useCollection<Club>('clubs', {
    filters: { status: 'pending' }
  });

  const handleRequest = async (clubId: string, newStatus: 'approved' | 'rejected') => {
    setLoading(prev => ({ ...prev, [clubId]: true }));
    try {
      await setDocumentNonBlocking('clubs', { status: newStatus }, clubId);

      toast({
        title: `Club ${newStatus}`,
        description: `The club request has been successfully ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating request',
        description: error.message,
      });
    } finally {
      setLoading(prev => ({ ...prev, [clubId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Club Requests</CardTitle>
        <CardDescription>
          Approve or reject requests for new clubs to be created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests && requests.length > 0 ? (
                requests.map(club => (
                  <TableRow key={club.id}>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.description}</TableCell>
                    <TableCell>{club.organizerId}</TableCell>
                    <TableCell className="text-right">
                      {loading[club.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-500" onClick={() => handleRequest(club.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRequest(club.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No pending club requests</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AllUsers() {
    const { toast } = useToast();
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const { data: users, isLoading } = useCollection<User>('users');

    const handleRoleChange = async (userId: string, newRole: 'student' | 'club_organizer' | 'admin') => {
        setLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await setDocumentNonBlocking('users', { role: newRole }, userId);

            toast({
                title: 'Role Updated',
                description: `User role has been successfully changed to ${newRole}.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating role', description: error.message });
        } finally {
            setLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="animate-spin" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell><Badge variant="secondary">{user.role.replace('_', ' ')}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        {loading[user.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'student')}><UserCheck className="mr-2 h-4 w-4" />Student</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'club_organizer')}><UserX className="mr-2 h-4 w-4" />Club Organizer</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}><ShieldCheck className="mr-2 h-4 w-4" />Admin</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function AllEvents() {
    const { toast } = useToast();

    const { data: events, isLoading } = useCollection<Event>('events');

    const handleDelete = async (eventId: string, eventTitle: string) => {
        try {
            await deleteDocumentNonBlocking('events', eventId);
            toast({
                title: 'Event Deleted',
                description: `"${eventTitle}" has been deleted.`,
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error deleting event', description: error.message });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Event Management</CardTitle>
                <CardDescription>View and manage all events in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="animate-spin" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Club</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events?.map(event => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell>{event.clubName}</TableCell>
                                    <TableCell>{formatDate(event.date)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild><Link href={`/dashboard/events/${event.id}`}>View Event</Link></DropdownMenuItem>
                                                <DropdownMenuItem asChild><Link href={`/dashboard/events/${event.id}/edit`}>Edit Event</Link></DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                                                    </DropdownMenuItem>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                      <AlertDialogDescription>This will permanently delete the event "{event.title}". This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDelete(event.id, event.title)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
       <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Admin Dashboard</h1>
      </div>
      <Tabs defaultValue="organizers">
        <TabsList>
          <TabsTrigger value="organizers">Organizer Requests</TabsTrigger>
          <TabsTrigger value="clubs">Club Requests</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="events">Event Management</TabsTrigger>
        </TabsList>
        <TabsContent value="organizers" className="mt-4">
          <OrganizerRequests />
        </TabsContent>
        <TabsContent value="clubs" className="mt-4">
          <ClubRequests />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <AllUsers />
        </TabsContent>
         <TabsContent value="events" className="mt-4">
          <AllEvents />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useAuth();
  const router = useRouter();

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>('users', user?.id);

  const isLoading = isUserLoading || isProfileLoading;

  useEffect(() => {
    // If we're done loading and the user is either not present or not an admin, redirect.
    if (!isLoading && (!userProfile || userProfile.role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [isLoading, userProfile, router]);


  // While loading, or if the user is not an admin, show a loading/redirecting message.
  // This prevents the child components (and their data fetches) from rendering.
  if (isLoading || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading or redirecting...</p>
      </div>
    );
  }

  // Only render the full dashboard if the user is a confirmed admin.
  return <AdminDashboard />;
}
