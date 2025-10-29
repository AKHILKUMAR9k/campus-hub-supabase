# Refined Authentication Fix Implementation Guide

## Context Recap
- Using Supabase Auth with RLS-protected users table.
- auth.uid() = id in users table → prevents profile insert before email confirmation.
- Immediate profile creation on signUp() → fails due to missing session (user not authenticated yet).
- After SIGNED_IN, provider creates a default profile → overwriting role/fullname details.

## Updated Step-by-Step Fix Plan
1. **Modify Signup Flow (src/app/signup/page.tsx)**: Stop premature profile creation before the user session exists. Remove the post-signup profile insert. After successful signUp(), store user details (name, role, email) in localStorage. Display a message: "Check your email to confirm your account. Once confirmed, your profile will be created automatically."

2. **Modify Auth Provider (src/supabase/provider.tsx)**: On successful sign-in, automatically create the user's profile using stored signup data. In the onAuthStateChange callback for SIGNED_IN: Check for 'pendingUserProfile' in localStorage. If exists, use that data to insert profile; else, check if profile exists, if not, create with defaults. Clear localStorage after creation.

3. **Update Profile Page (src/app/dashboard/profile/page.tsx)**: Graceful handling when profile doesn't exist. If profile === null, show: "Profile not found. Please go to Settings to create or update your profile." Optionally include a link/button to redirect to Settings.

4. **Update Settings Page (src/app/dashboard/settings/page.tsx)**: Allow users to create/update profile if it doesn't exist. On page load, check if profile exists. If not found, render a form to create a profile (with insert). Otherwise, render update form (with update).

5. **Improve Logout (src/components/common/app-header.tsx)**: Wrap logout in a try/catch: try { await supabase.auth.signOut(); } catch (err) { toast.error("Logout failed. Please try again."); console.error(err); }

6. **Testing Plan**:
   - Email signup: Signup inserts nothing yet. After verification + login → profile created with name and role.
   - Google signup: Profile auto-created with defaults (name, email, student).
   - Returning login: If profile exists → fetched normally. If not → created with defaults.
   - Profile page: Shows data or "not found" message.
   - Settings page: Allows creating/updating profile.
   - Logout: Works smoothly, shows toast on errors.

## Dependent Files to Edit
- src/app/signup/page.tsx
- src/supabase/provider.tsx
- src/app/dashboard/profile/page.tsx
- src/app/dashboard/settings/page.tsx
- src/components/common/app-header.tsx

## Completed Tasks
- [x] Modified Signup Flow (src/app/signup/page.tsx): Updated toast message to inform user about profile creation after email confirmation.
- [x] Modified Auth Provider (src/supabase/provider.tsx): Already handles pendingUserProfile from localStorage on SIGNED_IN.
- [x] Updated Profile Page (src/app/dashboard/profile/page.tsx): Added graceful handling for missing profile with link to settings.
- [x] Updated Settings Page (src/app/dashboard/settings/page.tsx): Already allows creating profile if not exists.
- [x] Improved Logout (src/components/common/app-header.tsx): Added try/catch with toast error handling.

## Followup Steps
- [x] Apply RLS policies for users table as specified.
- [x] Run the app and verify no console errors.
