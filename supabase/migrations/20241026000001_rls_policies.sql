-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clubs ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to read basic user info (for displaying names, etc.)
CREATE POLICY "Authenticated users can view basic user info" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow new user registration
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Events table policies
-- Everyone can view events
CREATE POLICY "Everyone can view events" ON events
  FOR SELECT USING (true);

-- Only authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = organizer_id);

-- Only organizers can update their own events
CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Only organizers can delete their own events
CREATE POLICY "Organizers can delete own events" ON events
  FOR DELETE USING (auth.uid() = organizer_id);

-- Clubs table policies
-- Everyone can view approved clubs
CREATE POLICY "Everyone can view approved clubs" ON clubs
  FOR SELECT USING (status = 'approved');

-- Only admins can view all clubs
CREATE POLICY "Admins can view all clubs" ON clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can create/update clubs
CREATE POLICY "Admins can manage clubs" ON clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Registrations table policies
-- Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create registrations for themselves
CREATE POLICY "Users can create own registrations" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete own registrations" ON registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Organizers can view registrations for their events
CREATE POLICY "Organizers can view event registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Comments table policies
-- Everyone can view comments
CREATE POLICY "Everyone can view comments" ON comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Reminders table policies
-- Users can view their own reminders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create reminders for themselves
CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Tags table policies
-- Everyone can view tags
CREATE POLICY "Everyone can view tags" ON tags
  FOR SELECT USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Event tags junction table policies
-- Everyone can view event tags
CREATE POLICY "Everyone can view event tags" ON event_tags
  FOR SELECT USING (true);

-- Only event organizers can manage event tags
CREATE POLICY "Organizers can manage event tags" ON event_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_tags.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- User clubs junction table policies
-- Users can view their own club memberships
CREATE POLICY "Users can view own club memberships" ON user_clubs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can join clubs
CREATE POLICY "Users can join clubs" ON user_clubs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave clubs
CREATE POLICY "Users can leave clubs" ON user_clubs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all club memberships
CREATE POLICY "Admins can manage club memberships" ON user_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
