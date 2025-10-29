

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'club_organizer' | 'admin';
  club_ids?: string[];
  emailPreferences?: {
    eventReminders: boolean;
    commentReplies: boolean;
    registrationConfirmations: boolean;
  };
  // Student-specific details
  rollNumber?: string;
  branch?: string;
  section?: string;
  // Organizer-specific details
  organizer_status?: 'pending' | 'approved' | 'rejected';
};

export type Club = {
  id: string;
  name: string;
  description: string;
  logo: string;
  organizerId: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Event = {
  id:string;
  title: string;
  description: string;
  longDescription?: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  clubName: string;
  organizerId:string;
  category: 'Tech' | 'Music' | 'Sports' | 'Art' | 'Cultural' | 'Career';
  tags: string[];
  isPast: boolean;
  registrationCount?: number;
  registrationLink?: string;
};

export type Registration = {
    id: string; // Will be the event's ID for user subcollection, or a unique ID for event subcollection
    eventId: string;
    userId: string;
    fullName: string;
    email: string;
    rollNumber: string;
    branch: string;
    section: string;
    registrationDate: any; // Firestore ServerTimestamp
    // For user's registration subcollection
    title?: string;
    date?: string;
    // For calendar display
    clubName?: string;
    venue?: string;
    time?: string;
}


export type Comment = {
  id: string;
  eventId: string;
  userId: string;
  user: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  text: string;
  timestamp: any; // Firestore ServerTimestamp
  likedBy: string[];
  dislikedBy: string[];
  replies?: Reply[];
};

export type Reply = {
  id: string;
  commentId: string;
  userId: string;
  user: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  text: string;
  timestamp: any; // Firestore ServerTimestamp
  likedBy: string[];
  dislikedBy: string[];
};

export type Reminder = {
  id: string; // Will be the eventId
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string; // ISO string
  createdAt: any; // Firestore ServerTimestamp
}
