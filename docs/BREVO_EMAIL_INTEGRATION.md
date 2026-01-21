# Brevo Email Integration

This document explains how SyncSEO integrates with Brevo (formerly Sendinblue) for email marketing, newsletter subscriptions, and user management.

---

## Table of Contents

1. [Overview](#overview)
2. [Brevo Account Setup](#brevo-account-setup)
3. [Environment Variables](#environment-variables)
4. [Email Lists](#email-lists)
5. [Integration Points](#integration-points)
6. [Google OAuth Integration](#google-oauth-integration)
7. [API Endpoints](#api-endpoints)
8. [Components](#components)
9. [How It Works](#how-it-works)
10. [Syncing Existing Users](#syncing-existing-users)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)
13. [Known Issues & Solutions](#known-issues--solutions)
14. [File Reference](#file-reference)

---

## Overview

SyncSEO uses Brevo for:

| Purpose | Brevo List | Trigger |
|---------|------------|---------|
| Registered users | SyncSEO user list (#4) | User signup |
| Newsletter subscribers | SyncSEO Newsletter list (#5) | Newsletter form/popup |

### Key Features

- **Automatic sync**: New users and subscribers are added to Brevo automatically
- **Graceful degradation**: If Brevo fails, core functionality (signup, etc.) continues
- **No duplicates**: Brevo's `updateEnabled` flag prevents duplicate contacts
- **Server-side only**: API key is never exposed to the client

---

## Brevo Account Setup

### 1. Create Brevo Account
Sign up at [brevo.com](https://www.brevo.com)

### 2. Get API Key
1. Go to **Settings** → **SMTP & API** → **API Keys**
2. Click **Generate a new API key**
3. Copy the key (starts with `xkeysib-`)

### 3. Create Lists
1. Go to **Contacts** → **Lists**
2. Create a folder: `SyncSEO People folder`
3. Create two lists:
   - **SyncSEO user list** (for registered users)
   - **SyncSEO Newsletter list** (for newsletter subscribers)
4. Note the list IDs (shown as #4, #5, etc.)

### 4. Configure Contact Attributes
Brevo uses these attributes for contacts:
- `EMAIL` - Contact email (automatic)
- `FIRSTNAME` - First name
- `LASTNAME` - Last name
- `NAME` - Full name (custom attribute)

To add the NAME attribute:
1. Go to **Contacts** → **Settings** → **Contact attributes**
2. Add attribute: `NAME` (type: Text)

---

## Environment Variables

Add these to `.env.local` and Vercel environment variables:

```env
# Brevo API Configuration
BREVO_API_KEY=xkeysib-your-api-key-here

# Brevo List IDs
BREVO_USER_LIST_ID=4
BREVO_NEWSLETTER_LIST_ID=5

# Email Configuration (for transactional emails)
EMAIL_FROM_NAME=SyncSEO
EMAIL_FROM_ADDRESS=syncseo.io@gmail.com
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `BREVO_API_KEY` | Your Brevo API key | `xkeysib-f12bf81...` |
| `BREVO_USER_LIST_ID` | List ID for registered users | `4` |
| `BREVO_NEWSLETTER_LIST_ID` | List ID for newsletter subscribers | `5` |
| `EMAIL_FROM_NAME` | Sender name for emails | `SyncSEO` |
| `EMAIL_FROM_ADDRESS` | Sender email address | `syncseo.io@gmail.com` |

---

## Email Lists

### SyncSEO User List (#4)

**Purpose:** Track all registered SyncSEO users

**Added when:**
- User completes signup form
- Called automatically after Supabase auth succeeds

**Data stored:**
- Email
- Full name (from signup form)
- Signup date

**Use cases:**
- Product announcements
- Feature updates
- Onboarding emails
- Re-engagement campaigns

### SyncSEO Newsletter List (#5)

**Purpose:** Newsletter subscribers (may or may not be users)

**Added when:**
- Visitor submits homepage newsletter form
- Visitor subscribes via newsletter popup

**Data stored:**
- Email
- Name
- Subscription date

**Use cases:**
- Weekly SEO tips
- Blog post notifications
- Content marketing
- Lead nurturing

---

## Integration Points

### 1. Email/Password Signup

**Location:** `/src/app/(auth)/signup/page.tsx`

**Flow:**
```
User fills signup form
    ↓
Supabase creates account
    ↓
If successful, call /api/newsletter/subscribe-user
    ↓
API adds user to Brevo list #4
    ↓
Show confirmation (Brevo call is non-blocking)
```

**Code:**
```typescript
// After successful Supabase signup
try {
    fetch('/api/newsletter/subscribe-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName }),
    }).catch(() => {
        // Silently fail - don't block signup
    });
} catch {
    // Silently fail - Brevo integration shouldn't break signup
}
```

**Important:** The Brevo call is non-blocking. If it fails, the user signup still succeeds.

### 2. Homepage Newsletter Form

**Location:** `/src/app/page.tsx`

**Flow:**
```
Visitor fills name + email
    ↓
Submit form
    ↓
Call /api/newsletter/subscribe
    ↓
API adds subscriber to Brevo list #5
    ↓
Show success message
    ↓
Set localStorage flag (for popup suppression)
```

### 3. Newsletter Popup

**Location:** `/src/components/marketing/NewsletterPopup.tsx`

**Flow:**
```
Page loads
    ↓
Check: Is user logged in? → Don't show
    ↓
Check: Already subscribed (localStorage)? → Don't show
    ↓
Check: Closed within 24 hours? → Don't show
    ↓
Wait for scroll event
    ↓
Wait 8 seconds
    ↓
Show popup
    ↓
On subscribe: Add to Brevo list #5, set localStorage
    ↓
On close: Set 24-hour cooldown in localStorage
```

### 4. Google OAuth Signup

**Locations:**
- `/src/app/(auth)/signup/page.tsx`
- `/src/app/(auth)/login/page.tsx`
- `/src/app/auth/callback/route.ts`
- `/src/lib/hooks/useBrevoSync.ts`

**Flow:**
```
User clicks "Continue with Google"
    ↓
Supabase initiates OAuth flow → Google
    ↓
User authenticates with Google
    ↓
Supabase redirects to /auth/callback (or Site URL)
    ↓
Callback route: Check if new user → Add to Brevo list #4
    ↓
OR: Dashboard fallback hook detects new OAuth user → Sync to Brevo
    ↓
User lands on dashboard
```

**Important:** Google OAuth users are synced via two mechanisms to ensure reliability:
1. **Primary:** `/auth/callback` route (server-side)
2. **Fallback:** `useBrevoSync` hook on dashboard (client-side)

---

## Google OAuth Integration

Users who sign up via Google OAuth are also synced to Brevo. This is handled through two mechanisms:

### 1. Auth Callback Route (Primary)

**Location:** `/src/app/auth/callback/route.ts`

**Flow:**
```
User clicks "Continue with Google"
    ↓
Redirected to Google OAuth
    ↓
Google redirects to Supabase
    ↓
Supabase redirects to /auth/callback
    ↓
Callback checks if new user (created_at ≈ last_sign_in_at)
    ↓
If new, calls /api/newsletter/subscribe-user
    ↓
User added to Brevo list #4
```

**Code:**
```typescript
if (isNewUser) {
    const fullName = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] || 'User';

    fetch(`${origin}/api/newsletter/subscribe-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: fullName }),
    });
}
```

### 2. Dashboard Fallback Hook (Backup)

**Location:** `/src/lib/hooks/useBrevoSync.ts`

Because Supabase may redirect OAuth users to the production Site URL instead of localhost during development, a fallback hook ensures new OAuth users are synced when they land on the dashboard.

**Flow:**
```
User lands on dashboard
    ↓
Hook checks: Is OAuth user? (app_metadata.provider !== 'email')
    ↓
Hook checks: Created within last 5 minutes?
    ↓
If both true, sync to Brevo
    ↓
Set sessionStorage flag to prevent duplicate syncs
```

**Usage:**
```typescript
// In dashboard layout
import { useBrevoSync } from '@/lib/hooks/useBrevoSync';

export default function DashboardLayout({ children }) {
    useBrevoSync(); // Called once when user lands on dashboard
    // ...
}
```

### Supabase OAuth Configuration

For Google OAuth to work correctly, configure these URLs in Supabase Dashboard:

**Authentication → URL Configuration:**

| Setting | Value |
|---------|-------|
| Site URL | `https://syncseo.io` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `https://syncseo.io/auth/callback` |
| | `https://dev-preview.syncseo.io/auth/callback` |

**Note:** Supabase uses the Site URL as the default redirect when the specified `redirectTo` doesn't match exactly. For local development, OAuth may redirect to production. The fallback hook handles this case.

---

## API Endpoints

### POST /api/newsletter/subscribe

Adds a contact to the newsletter list.

**Request:**
```json
{
    "email": "user@example.com",
    "name": "John Doe"
}
```

**Response (Success):**
```json
{
    "success": true,
    "message": "Successfully subscribed to newsletter"
}
```

**Response (Already subscribed):**
```json
{
    "success": true,
    "message": "You're already subscribed!"
}
```

**Response (Error):**
```json
{
    "error": "Invalid email address"
}
```

### POST /api/newsletter/subscribe-user

Adds a registered user to the user list. Called during signup.

**Request:**
```json
{
    "email": "user@example.com",
    "name": "John Doe"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User added to Brevo"
}
```

---

## Components

### NewsletterPopup

**File:** `/src/components/marketing/NewsletterPopup.tsx`

**Props:** None (self-contained)

**Behavior:**
| Condition | Action |
|-----------|--------|
| User logged in | Don't show |
| Already subscribed | Don't show |
| Closed within 24 hours | Don't show |
| First visit, scrolled, 8 seconds passed | Show |

**localStorage Keys:**
- `newsletter_subscribed` - Set to `'true'` after subscribing
- `newsletter_popup_closed_at` - Timestamp when closed

**Dark Mode:** Fully supported with `dark:` classes

**Usage:**
```tsx
import { NewsletterPopup } from '@/components/marketing/NewsletterPopup';

// Add to page
<NewsletterPopup />
```

---

## How It Works

### Brevo API Client

**File:** `/src/lib/brevo/client.ts`

**Functions:**

```typescript
// Add contact to any list(s)
addContactToBrevo(email: string, name: string, listIds: number[]): Promise<BrevoResponse>

// Add registered user to user list
addUserToBrevo(email: string, name: string): Promise<BrevoResponse>

// Add newsletter subscriber
addNewsletterSubscriber(email: string, name: string): Promise<BrevoResponse>
```

**API Call:**
```typescript
const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
        email: email.toLowerCase(),
        attributes: {
            FIRSTNAME: firstName,
            LASTNAME: lastName,
            NAME: fullName,
        },
        listIds: [listId],
        updateEnabled: true, // Update if exists
    }),
});
```

**Response Codes:**
| Status | Meaning |
|--------|---------|
| 201 | Contact created |
| 204 | Contact updated (already existed) |
| 400 | Invalid request |
| 401 | Invalid API key |

---

## Syncing Existing Users

To sync users who registered before Brevo integration:

### Method: Supabase SQL Export + Brevo Import

**Step 1: Export from Supabase**

Run this in Supabase Dashboard → SQL Editor:

```sql
-- Export users for Brevo import (READ-ONLY)
SELECT
    email,
    raw_user_meta_data->>'full_name' AS name,
    created_at
FROM auth.users
WHERE email IS NOT NULL
ORDER BY created_at DESC;
```

**Step 2: Download CSV**
- Click **Run**
- Click **Export to CSV**

**Step 3: Import to Brevo**
1. Go to Brevo → **Contacts** → **Import contacts**
2. Upload the CSV file
3. Map columns:
   - `email` → Email
   - `name` → NAME (or split into FIRSTNAME/LASTNAME)
4. Select list: **SyncSEO user list (#4)**
5. Click **Import**

**Note:** This is a one-time operation. New signups are handled automatically.

---

## Testing

### Test Newsletter Subscription

1. Go to homepage
2. Scroll to newsletter section
3. Enter name and email
4. Click Subscribe
5. Check Brevo → Contacts → SyncSEO Newsletter list

### Test Newsletter Popup

1. Open homepage in **incognito/private window**
2. Scroll down the page
3. Wait 8 seconds
4. Popup should appear
5. Subscribe or close
6. Refresh - popup should not appear (24hr cooldown or subscribed)

### Test User Signup

1. Go to `/signup`
2. Create a new account
3. Check Brevo → Contacts → SyncSEO user list
4. New user should appear

### Test Popup Suppression

| Scenario | Expected |
|----------|----------|
| Logged in user | Popup never shows |
| Already subscribed | Popup never shows |
| Closed popup | Popup won't show for 24 hours |
| New incognito visitor | Popup shows after scroll + 8s |

---

## Troubleshooting

### Contact Not Added to Brevo

**Check:**
1. API key is correct in environment variables
2. List ID is correct
3. Check server logs for errors
4. Verify Brevo account is active

**Debug:**
```typescript
// Add to brevo/client.ts for debugging
console.log('[Brevo] Adding contact:', { email, listIds });
console.log('[Brevo] Response:', response.status);
```

### Popup Not Showing

**Check:**
1. Not logged in (check Supabase auth)
2. `newsletter_subscribed` not in localStorage
3. `newsletter_popup_closed_at` not within 24 hours
4. Scrolled the page
5. Waited 8 seconds after scroll

**Debug in browser console:**
```javascript
localStorage.getItem('newsletter_subscribed')
localStorage.getItem('newsletter_popup_closed_at')

// Clear to reset
localStorage.removeItem('newsletter_subscribed')
localStorage.removeItem('newsletter_popup_closed_at')
```

### Duplicate Contacts

Brevo handles this automatically with `updateEnabled: true`. Existing contacts are updated, not duplicated.

### API Key Exposed

The API key should **never** be in client-side code. All Brevo calls go through API routes:
- `/api/newsletter/subscribe`
- `/api/newsletter/subscribe-user`

---

## Known Issues & Solutions

### Issue 1: Newsletter Form Stuck on "Subscribing..."

**Symptom:** Newsletter form shows "Subscribing..." indefinitely or times out.

**Diagnosis:**
1. Check browser Network tab for `/api/newsletter/subscribe` response
2. Check terminal for `[Brevo]` logs
3. Verify `BREVO_API_KEY` is set correctly

**Root Cause:** Brevo API can be slow to respond (10-30 seconds sometimes).

**Solution:** The Brevo client includes logging to track request timing:
```
[Brevo] Starting request for email@test.com to lists 5
[Brevo] Response received in 15234ms, status: 201
```

If requests consistently timeout:
- Verify API key is valid in Brevo dashboard
- Check if Brevo service is operational
- The contact may still be added despite timeout (check Brevo dashboard)

### Issue 2: Google OAuth Redirects to Production Instead of Localhost

**Symptom:** When testing Google OAuth locally, user is redirected to `syncseo.io` instead of `localhost:3000`.

**Root Cause:** Supabase's OAuth flow uses the Site URL as the default redirect when:
- The `redirectTo` parameter doesn't exactly match an allowed Redirect URL
- Supabase can't determine the correct redirect

**Diagnosis:**
1. Check browser console for `[Google Signup] Redirect URL: http://localhost:3000/auth/callback`
2. Verify Supabase Redirect URLs include `http://localhost:3000/auth/callback`
3. Check if Site URL is set to production domain

**Solution:**
1. The `useBrevoSync` hook handles this by syncing OAuth users when they land on the dashboard
2. For production testing, OAuth works correctly
3. Accept that local OAuth testing may redirect to production

**Configuration in Supabase:**
```
Site URL: https://syncseo.io
Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://syncseo.io/auth/callback
  - https://*.vercel.app/auth/callback
```

### Issue 3: Google OAuth Users Not Added to Brevo

**Symptom:** Users who sign up via Google don't appear in the Brevo user list.

**Diagnosis:**
1. Check terminal for `[Auth Callback]` logs when user signs in
2. Look for: `[Auth Callback] Adding new OAuth user to Brevo: email@gmail.com`
3. Check if `isNewUser` is `true` or `false`

**Root Cause Options:**
- User is not new (has signed in before) - `isNewUser: false`
- OAuth callback route not being hit (see Issue 2)
- Brevo API call failing silently

**Solution:**
1. The fallback `useBrevoSync` hook syncs new OAuth users on dashboard load
2. Check terminal for `[Brevo Sync] Syncing new OAuth user: email@gmail.com`
3. User must be created within last 5 minutes to be considered "new"

### Issue 4: Browser Cache Causing OAuth Redirect Issues

**Symptom:** OAuth redirects to unexpected URLs (like `/mover` or old paths).

**Diagnosis:** Try the same flow in incognito/private browsing mode.

**Root Cause:** Browser has cached old OAuth redirect configurations.

**Solution:**
1. Clear browser cookies/cache for `localhost` domain
2. In Chrome: `chrome://settings/cookies/detail?site=localhost` → Remove all
3. Or use incognito mode for testing

### Issue 5: Newsletter Popup Not Showing

**Symptom:** Newsletter popup never appears for visitors.

**Diagnosis checklist:**
| Check | How to verify |
|-------|---------------|
| Not logged in | Check Supabase auth state |
| Not already subscribed | `localStorage.getItem('newsletter_subscribed')` |
| Not closed recently | `localStorage.getItem('newsletter_popup_closed_at')` |
| Has scrolled | Scroll the page |
| Waited 8 seconds | Wait after scrolling |

**Solution:**
```javascript
// Clear localStorage to reset popup state
localStorage.removeItem('newsletter_subscribed');
localStorage.removeItem('newsletter_popup_closed_at');
```

---

## File Reference

| File | Purpose |
|------|---------|
| `/src/lib/brevo/client.ts` | Brevo API utility functions |
| `/src/lib/hooks/useBrevoSync.ts` | Fallback hook for OAuth user sync |
| `/src/app/api/newsletter/subscribe/route.ts` | Newsletter subscription endpoint |
| `/src/app/api/newsletter/subscribe-user/route.ts` | User registration endpoint |
| `/src/app/auth/callback/route.ts` | OAuth callback with Brevo integration |
| `/src/components/marketing/NewsletterPopup.tsx` | Newsletter popup component |
| `/src/app/page.tsx` | Homepage with newsletter form |
| `/src/app/(auth)/signup/page.tsx` | Signup with Brevo & Google OAuth |
| `/src/app/(auth)/login/page.tsx` | Login with Google OAuth |
| `/src/app/(dashboard)/layout.tsx` | Dashboard layout with useBrevoSync hook |

---

## Future Enhancements

- [ ] Transactional emails via Brevo (welcome email, password reset)
- [ ] Email campaign tracking
- [ ] Unsubscribe handling
- [ ] Double opt-in for newsletter
- [ ] Segmentation based on user plan

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-17 | Initial Brevo integration |
| 2026-01-17 | Added newsletter popup |
| 2026-01-17 | Added user signup integration |
| 2026-01-20 | Added Google OAuth integration |
| 2026-01-20 | Added OAuth callback route for Brevo sync |
| 2026-01-20 | Added useBrevoSync fallback hook for dashboard |
| 2026-01-20 | Documented Supabase OAuth redirect behavior |
| 2026-01-20 | Added Known Issues & Solutions section |

---

*Last updated: January 20, 2026*
