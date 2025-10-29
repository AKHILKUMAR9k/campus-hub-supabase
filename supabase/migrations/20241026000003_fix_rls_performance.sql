-- Fix RLS policy performance issues by wrapping auth function calls in subqueries
-- This prevents per-row evaluation of auth.uid() and auth.role()

-- Users table policies - fix performance
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Authenticated users can view basic user info" ON users;
CREATE POLICY "Authenticated users can view basic user info" ON users
  FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Allow user registration" ON users;
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Events table policies - fix performance
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated' AND (SELECT auth.uid()) = organizer_id);

DROP POLICY IF EXISTS "Organizers can update own events" ON events;
CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE USING ((SELECT auth.uid()) = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete own events" ON events;
CREATE POLICY "Organizers can delete own events" ON events
  FOR DELETE USING ((SELECT auth.uid()) = organizer_id);

-- Clubs table policies - fix performance
DROP POLICY IF EXISTS "Admins can view all clubs" ON clubs;
CREATE POLICY "Admins can view all clubs" ON clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage clubs" ON clubs;
CREATE POLICY "Admins can manage clubs" ON clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Registrations table policies - fix performance
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations" ON registrations
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own registrations" ON registrations;
CREATE POLICY "Users can create own registrations" ON registrations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own registrations" ON registrations;
CREATE POLICY "Users can delete own registrations" ON registrations
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Organizers can view event registrations" ON registrations;
CREATE POLICY "Organizers can view event registrations" ON registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = (SELECT auth.uid())
    )
  );

-- Comments table policies - fix performance
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated' AND (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Reminders table policies - fix performance
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own reminders" ON reminders;
CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Tags table policies - fix performance
DROP POLICY IF EXISTS "Admins can manage tags" ON tags;
CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- Event tags junction table policies - fix performance
DROP POLICY IF EXISTS "Organizers can manage event tags" ON event_tags;
CREATE POLICY "Organizers can manage event tags" ON event_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_tags.event_id
      AND events.organizer_id = (SELECT auth.uid())
    )
  );

-- User clubs junction table policies - fix performance
DROP POLICY IF EXISTS "Users can view own club memberships" ON user_clubs;
CREATE POLICY "Users can view own club memberships" ON user_clubs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can join clubs" ON user_clubs;
CREATE POLICY "Users can join clubs" ON user_clubs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can leave clubs" ON user_clubs;
CREATE POLICY "Users can leave clubs" ON user_clubs
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage club memberships" ON user_clubs;
CREATE POLICY "Admins can manage club memberships" ON user_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );
