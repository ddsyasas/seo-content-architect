# Brevo Email Integration

This document explains how SyncSEO integrates with Brevo (formerly Sendinblue) for email marketing, newsletter subscriptions, and user management.

---

## Table of Contents

1. [Overview](#overview)
2. [Brevo Account Setup](#brevo-account-setup)
3. [Environment Variables](#environment-variables)
4. [Email Lists](#email-lists)
5. [Integration Points](#integration-points)
6. [API Endpoints](#api-endpoints)
7. [Components](#components)
8. [How It Works](#how-it-works)
9. [Syncing Existing Users](#syncing-existing-users)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [File Reference](#file-reference)

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

### 1. User Signup

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

## File Reference

| File | Purpose |
|------|---------|
| `/src/lib/brevo/client.ts` | Brevo API utility functions |
| `/src/app/api/newsletter/subscribe/route.ts` | Newsletter subscription endpoint |
| `/src/app/api/newsletter/subscribe-user/route.ts` | User registration endpoint |
| `/src/components/marketing/NewsletterPopup.tsx` | Newsletter popup component |
| `/src/app/page.tsx` | Homepage with newsletter form |
| `/src/app/(auth)/signup/page.tsx` | Signup with Brevo integration |

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

---

*Last updated: January 17, 2026*
