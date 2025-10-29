# Campus Hub – Events Dashboard (Supabase)

Next.js (App Router) + TypeScript + Tailwind CSS frontend powered by Supabase (Auth, Postgres, Storage). This project provides an events platform for college clubs with authentication, profiles, events CRUD, registrations, comments, and dashboards.

## Quick start

1) Prereqs
- Node 18+
- Supabase CLI (optional but recommended)
- A Supabase project (or use local dev via Supabase CLI)

2) Clone and install
```bash
npm install
```

3) Environment variables
Create `.env.local` in the project root with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SENDGRID_API_KEY=your_sendgrid_key_optional
FROM_EMAIL=noreply@campushub.com
```

4) Database schema and RLS policies
- SQL files are provided under `supabase/schema.sql` and `supabase/policies.sql`.
- Apply them in Supabase SQL editor, or with Supabase CLI:
```bash
supabase db push --include=./supabase/schema.sql --include=./supabase/policies.sql
```

Tables created:
- `users(id uuid pk, full_name, email, role enum, created_at)`
- `events(id serial pk, title, description, date timestamptz, venue, club, category, image_url, created_by uuid, is_completed)`
- `registrations(id serial pk, event_id int, user_id uuid, registered_at)`
- `comments(id serial pk, event_id int, user_id uuid, content, parent_comment int, likes, created_at)`
- `resources` (optional)

RLS policies in `supabase/policies.sql` enforce:
- Users can read/insert/update their own user row (`auth.uid() = id`)
- Anyone can read events; only creators (`created_by = auth.uid()`) can create/update/delete
- Users can create/delete their own registrations and view their own; organizers can read registrations for their events
- Comments are public to read; only authors can write/update/delete

5) Storage bucket
- Create a public bucket named `event-images` in Supabase Storage.
- The app uploads event posters to `event-images/events/<userId>/<timestamp>.ext` and reads via public URLs.

6) Run
```bash
npm run dev
```
App runs at `http://localhost:9002` (see `package.json`).

## Auth flow (Email + Google)
- Signup page saves `pendingUserProfile` in `localStorage` with name/role/email.
- On Auth `SIGNED_IN`, the provider inserts the `users` row with `id = auth.uid()` using pending profile data if present; otherwise falls back to metadata/defaults. Pending data is cleared after insert.
- Logout is wrapped with toasts and error handling.

## Key implementation details

- Supabase client lives in `src/supabase/client.ts` and is used across the app.
- Storage helper `uploadToStorage(file, path)` is in `src/supabase/utils.ts`.
- Events CRUD uses both legacy (camelCase) and new (snake_case) fields to keep the UI stable while the DB uses the new schema:
  - New: `created_by`, `image_url`, `is_completed`, `long_description`, `club`
  - Legacy UI fields still present for rendering
- Registrations: inserts write `event_id`/`user_id`/`registered_at` (with legacy fields for UI compatibility).
- Comments: use `comments(event_id, user_id, content, parent_comment, likes)` and render threaded replies via `parent_comment`.
- Email: API route at `src/app/api/send-email/route.ts` uses SendGrid if `SENDGRID_API_KEY` is provided. In-app toasts are used for confirmations.

## Pages
- `/` Login
- `/signup` Signup
- `/dashboard` Upcoming events with filters/search/date range
- `/dashboard/past-events` Past events gallery
- `/dashboard/my-events` Student dashboard (registrations + calendar summary)
- `/dashboard/manage-events` Organizer dashboard (manage own events)
- `/dashboard/events/[id]` Event details (register, add-to-calendar, comments on past events)
- `/dashboard/events/[id]/edit` Organizer-only event edit
- `/dashboard/settings` Create/update profile
- `/dashboard/profile` View profile

## Development notes
- The codebase still supports some legacy fields from a Firebase migration to minimize UI disruption. New inserts/updates target snake_case columns; readers accept both.
- If you want to fully drop legacy fields, refactor `src/lib/types.ts` and rendering components to the new schema and remove camelCase usage.

## Minimal testing suggestions
- Add React Testing Library tests for auth provider behavior on SIGNED_IN (pending profile insert).
- Component tests for `EventForm` (validation + storage upload mocked).
- Integration tests for comments threading logic with mocked Supabase client.

## Troubleshooting
- 401/permission errors: ensure you are authenticated and that `id` in the `users` insert matches `auth.uid()`.
- Storage errors: verify `event-images` bucket exists and is public.
- Google auth: enable Google provider in Supabase Auth and set callback to your site URL.
