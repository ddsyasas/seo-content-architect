# Prisma Migration Plan: Supabase JS Client to Prisma ORM

> **Document Created:** January 2026
> **Status:** ✅ Migration Complete - Ready for Preview Testing
> **Risk Level:** Medium-High (Production app with paid users)
> **Branches:** `develop` (testing) → `main` (production)
> **Development Flow:** Local → Develop Branch → Main Branch

---

## Migration Progress Log

> This section tracks real-time progress. Update after each step.

### Phase 0: Environment Setup

| Step | Status | Date | Notes |
|------|--------|------|-------|
| Create Dev Supabase Project | ✅ Done | Jan 20, 2026 | Created in test account |
| Get connection credentials | ✅ Done | Jan 20, 2026 | See Dev Database Info below |
| Apply schema migrations | ✅ Done | Jan 20, 2026 | Used combined script |
| Configure Vercel Preview env vars | ⬚ Pending | | Setup before pushing to develop |
| Configure local .env.local | ✅ Done | Jan 20, 2026 | Switched to dev DB |
| Test local connection | ✅ Done | Jan 20, 2026 | All features verified |
| Create test data | ✅ Done | Jan 20, 2026 | Test user + project created |

#### Local Testing Results (Jan 20, 2026)
- ✅ Signup flow (confirmation email received)
- ✅ Login flow
- ✅ Free plan detected correctly
- ✅ Project creation works
- ✅ Plan limits enforced (1 project for free)
- ✅ Canvas loads correctly
- ✅ Article creation works
- ✅ Auto-save to canvas works
- ✅ Node connections/interlinking works

#### Stripe Testing Results (Jan 20, 2026)
- ✅ Free → Pro upgrade via Stripe checkout
- ✅ Pro project limits (5 projects)
- ✅ Pro → Agency upgrade
- ✅ Agency project limits (>5 projects)
- ✅ Agency → Pro downgrade
- ⚠️ Billing portal (expected: not available on localhost)

#### Team Invite Testing Results (Jan 20, 2026)
- ✅ Team invite sends successfully (after RLS fix in invite route)
- ✅ Invitation email received
- ⚠️ Invitation link shows invalid (likely localhost issue - test on Vercel preview)
- ⚠️ Sent invitations not showing in UI (RLS issue - fix later)

**Note:** Fixed `src/app/api/projects/[id]/team/invite/route.ts` to use admin client for DB operations.

#### Dev Database Info (Test Account)
```
Project Reference: xbylfjiyyalqcqqnjcju
Project URL: https://xbylfjiyyalqcqqnjcju.supabase.co
Region: aws-1-eu-west-1
Pooler Host: aws-1-eu-west-1.pooler.supabase.com
Transaction Pooler Port: 6543
Session Pooler Port: 5432
```
> **Note:** API keys and passwords stored in `.env.local` (not in this doc for security)

#### Schema Migration for Dev Database

**Combined script created:** `supabase-dev-setup-complete.sql`

This single file contains all 11 migrations combined in the correct order:
1. Core tables (profiles, projects, nodes, edges, canvas_settings)
2. Business tables (subscriptions, team_members, team_invitations)
3. Articles table + domain column
4. Edge enhancements (styling, handles)
5. SEO edge types
6. Storage buckets
7. Signup fixes
8. RLS helper function
9. Final RLS policies

**To run:**
1. Open Supabase SQL Editor: https://xbylfjiyyalqcqqnjcju.supabase.co → SQL Editor
2. Copy entire contents of `supabase-dev-setup-complete.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Should see: "DATABASE SETUP COMPLETE!"

### Phase 1: Prisma Setup
| Step | Status | Date | Notes |
|------|--------|------|-------|
| Install Prisma packages | ✅ Done | Jan 20, 2026 | prisma, @prisma/client, @prisma/adapter-pg |
| Initialize Prisma | ✅ Done | Jan 20, 2026 | Prisma 7 with prisma.config.ts |
| Configure environment | ✅ Done | Jan 20, 2026 | .env with DATABASE_URL and DIRECT_URL |
| Run prisma db pull | ✅ Done | Jan 20, 2026 | 29 models introspected (auth + public schemas) |
| Generate Prisma client | ✅ Done | Jan 20, 2026 | Using @prisma/adapter-pg for Prisma 7 |
| Create Prisma client singleton | ✅ Done | Jan 20, 2026 | /src/lib/prisma.ts |
| Test Prisma queries locally | ✅ Done | Jan 20, 2026 | Test script passed - 3 profiles, 6 projects |
| Push to develop | ⬚ Pending | | Next step |
| Test on Vercel Preview | ⬚ Pending | | |

#### Prisma 7 Configuration Notes (Jan 20, 2026)
- **Breaking change:** Prisma 7 no longer supports `url` and `directUrl` in schema.prisma
- **Solution:** URL moved to `prisma.config.ts` for migrations
- **Client adapter:** Using `@prisma/adapter-pg` for runtime database connection
- **multiSchema:** Now stable feature (no longer needs preview flag)

#### Files Created/Modified
- `prisma/schema.prisma` - 29 models from auth + public schemas
- `prisma.config.ts` - Prisma 7 configuration (migrations use DIRECT_URL)
- `.env` - DATABASE_URL and DIRECT_URL for dev database
- `src/lib/prisma.ts` - Singleton client with PrismaPg adapter
- `scripts/test-prisma.ts` - Connection test script |

### Phase 2: API Routes Migration
| Step | Status | Date | Notes |
|------|--------|------|-------|
| Migrate /api/projects route | ✅ Done | Jan 20, 2026 | GET route tested and working |
| Migrate /api/limits route | ✅ Done | Jan 20, 2026 | Uses migrated limit-checker.ts |
| Migrate /api/team routes | ✅ Done | Jan 20, 2026 | GET/POST/PATCH/DELETE all migrated |
| Migrate /api/billing routes | ✅ Done | Jan 20, 2026 | All 7 billing routes migrated |
| Migrate /api/webhooks/stripe | ✅ Done | Jan 20, 2026 | All webhook handlers migrated |
| Migrate /api/admin/users | ✅ Done | Jan 20, 2026 | Keeps Supabase Admin for auth ops |
| Migrate /api/invitations | ✅ Done | Jan 20, 2026 | Token acceptance flow migrated |
| TypeScript compilation | ✅ Done | Jan 20, 2026 | All errors fixed |
| Next.js build | ✅ Done | Jan 20, 2026 | Build passes successfully |
| Local Prisma test | ✅ Done | Jan 20, 2026 | /api/test-prisma confirms working |

#### Files Migrated to Prisma (Jan 20, 2026)

**API Routes:**
- `src/app/api/projects/route.ts` - GET with Prisma findMany + includes
- `src/app/api/projects/[id]/team/route.ts` - Uses `profiles_team_members_user_idToprofiles` relation
- `src/app/api/projects/[id]/team/[memberId]/route.ts` - PATCH/DELETE operations
- `src/app/api/projects/[id]/team/invite/route.ts` - Team invitation creation
- `src/app/api/projects/[id]/team/invite/[invitationId]/route.ts` - Invitation management
- `src/app/api/team/route.ts` - Global team list (keeps Supabase Admin for auth.admin.listUsers)
- `src/app/api/team/[userId]/route.ts` - Role update and member removal
- `src/app/api/admin/users/route.ts` - Keeps Supabase Admin for auth.admin.deleteUser
- `src/app/api/invitations/[token]/route.ts` - Invitation acceptance
- `src/app/api/billing/create-checkout-session/route.ts`
- `src/app/api/billing/sync-subscription/route.ts`
- `src/app/api/billing/update-subscription/route.ts`
- `src/app/api/billing/cancel-subscription/route.ts`
- `src/app/api/billing/reactivate-subscription/route.ts`
- `src/app/api/billing/create-portal-session/route.ts`
- `src/app/api/billing/check-downgrade/route.ts`
- `src/app/api/billing/send-welcome-email/route.ts`
- `src/app/api/webhooks/stripe/route.ts` - All webhook handlers (checkout, subscription, invoice)
- `src/app/api/projects/[id]/role/route.ts` - Get user's role for a project (NEW)
- `src/app/api/nodes/[nodeId]/share/route.ts` - Toggle/get share status (NEW)
- `src/app/api/share/[shareId]/route.ts` - Public API to fetch shared article (NEW)

**Utility Files:**
- `src/lib/utils/limit-checker.ts` - All plan limit checking functions migrated

**Routes NOT Needing Migration (no database queries):**
- `src/app/api/contact/route.ts` - Only sends email via Brevo
- `src/app/api/newsletter/subscribe/route.ts` - Only calls Brevo API
- `src/app/api/newsletter/subscribe-user/route.ts` - Only calls Brevo API

#### Additional Bug Fixes (Jan 20, 2026)

**Shareable Links Feature Fix:**
- Issue: Share toggle wasn't working after Prisma migration
- Root cause 1: `is_public` and `share_id` columns weren't pushed to database (only in schema)
- Root cause 2: Existing nodes had NULL `share_id` values
- Fix: Ran `prisma db push` and added `share_id` generation logic in API
- Files created:
  - `src/app/api/share/[shareId]/route.ts` - Public API to fetch shared article
  - `src/app/api/nodes/[nodeId]/share/route.ts` - API to toggle share status
- See `docs/SHAREABLE_LINKS.md` for full details

**Editor/Viewer Role Permissions Fix:**
- Issue: Team members with "editor" role couldn't move nodes on canvas
- Root cause: Role was fetched via Supabase client (blocked by RLS)
- Fix: Created `/api/projects/[id]/role/route.ts` to get role via Prisma
- Updated `article-editor.tsx` with `canEdit` check using `canEditContent()` from roles util
- Updated `rich-text-editor.tsx` with `readOnly` prop

#### Schema Issues Fixed (Jan 20, 2026)

**Problem 1: `accepted_by` field doesn't exist in `team_invitations` table**
- The original code referenced `accepted_by` but this field was never in the schema
- **Fix:** Removed all references to `accepted_by` in:
  - `src/app/api/invitations/[token]/route.ts` (line 155)
  - `src/app/api/team/[userId]/route.ts` (lines 49, 100, 103)
  - `src/app/api/team/route.ts` (lines 59, 70)
  - `src/lib/utils/limit-checker.ts` (lines 146, 150, 241, 245)
- **Alternative:** Team members are now counted from `team_members` table instead

**Problem 2: Incorrect relation name for `profiles` in `team_members`**
- Prisma schema has `profiles_team_members_user_idToprofiles` (not just `profiles`)
- **Fix:** Updated `src/app/api/projects/[id]/team/route.ts` to use correct relation name

#### Migration Pattern Used

All API routes follow this pattern:
1. **Keep Supabase Auth** for user authentication:
   ```typescript
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();
   ```
2. **Use Prisma** for all database queries:
   ```typescript
   const projects = await prisma.projects.findMany({
       where: { user_id: user.id },
       include: { /* relations */ },
   });
   ```
3. **Keep Supabase Admin** only for Auth Admin API calls:
   - `supabase.auth.admin.listUsers()` - for listing users
   - `supabase.auth.admin.getUserById()` - for user lookups
   - `supabase.auth.admin.deleteUser()` - for user deletion

#### Test Results (Jan 20, 2026)
```json
// GET /api/test-prisma response:
{
  "success": true,
  "message": "Prisma is working in Next.js!",
  "data": {
    "profiles": 3,
    "projects": 6,
    "nodes": 3,
    "articles": 3
  }
}
```

### Phase 3: Server Components Migration (Complete ✅)

| Step | Status | Date | Notes |
|------|--------|------|-------|
| Migrate /settings/billing | ✅ Done | Jan 20, 2026 | Split into Server + Client components |
| Migrate /settings/preferences | ⏭️ Skipped | Jan 20, 2026 | Uses localStorage only, must stay client |
| Migrate /dashboard | ✅ Done | Jan 20, 2026 | Pure Server Component with Prisma |
| Migrate /projects | ✅ Done | Jan 20, 2026 | Split into Server + Client (CRUD modals) |
| Migrate /settings/profile | ✅ Done | Jan 20, 2026 | Split into Server + Client (forms) |
| Migrate /invite/[token] | ✅ Done | Jan 20, 2026 | Split into Server + Client components |
| Migrate /settings/team | ✅ Done | Jan 20, 2026 | Split into Server + Client components |
| Migrate /settings/subscription | ✅ Done | Jan 20, 2026 | Split into Server + Client components |

#### Phase 3 Files Changed (Jan 20, 2026)

**`/settings/billing/page.tsx`** - Converted to Server Component
- Server Component fetches subscription data with Prisma
- Created `billing-content.tsx` client component for button handlers
- Removed `useEffect`, `useState` for data fetching
- Data passed as props to client component

**`/dashboard/page.tsx`** - Converted to Pure Server Component
- All data fetching done server-side with Prisma
- Fetches owned projects + team member projects
- Counts articles and nodes server-side
- No client component needed (only Links, which work in RSC)
- Removed Supabase client import completely

**`/settings/preferences/page.tsx`** - Skipped (localStorage only)
- This page only uses browser localStorage
- No database queries - must remain client component

**`/projects/page.tsx`** - Converted to Server Component
- Server Component fetches owned projects + team projects with Prisma
- Counts nodes and articles server-side
- Created `projects-content.tsx` client component for CRUD modals/search
- Data passed as props to client component

**`/settings/profile/page.tsx`** - Converted to Server Component
- Server Component fetches profile data with Prisma
- Created `profile-content.tsx` client component for forms
- Handles profile update and password change forms

**`/invite/[token]/page.tsx`** - Converted to Server Component
- Server Component fetches invitation details with Prisma
- Created `invite-content.tsx` client component for accept button
- Handles various UI states (needsAuth, emailMismatch, success)
- Dark mode support added to all UI states

**`/settings/team/page.tsx`** - Converted to Server Component
- Server Component fetches team members and invitations with Prisma
- Created `team-content.tsx` client component for invite form, role changes
- Handles team limit checks and free plan restrictions
- Data passed as TeamPageData props

**`/settings/subscription/page.tsx`** - Converted to Server Component
- Server Component fetches subscription and usage counts with Prisma
- Created `subscription-content.tsx` client component for Stripe interactions
- Handles cancellation, reactivation, sync status, dev mode plan switching
- Usage counts (projects, articles, nodes, team members) fetched server-side

#### Server Component Migration Pattern

```typescript
// BEFORE: Client Component with useEffect
'use client';
export default function Page() {
    const [data, setData] = useState(null);
    useEffect(() => {
        fetch('/api/...').then(r => r.json()).then(setData);
    }, []);
    return <div>{data}</div>;
}

// AFTER: Server Component with Prisma
export default async function Page() {
    const data = await prisma.table.findMany({...});
    return <div>{data}</div>;
}

// AFTER (with interactivity): Server + Client Component
// page.tsx (Server Component)
export default async function Page() {
    const data = await prisma.table.findMany({...});
    return <PageContent data={data} />;  // Pass data as props
}

// page-content.tsx (Client Component)
'use client';
export function PageContent({ data }) {
    const [state, setState] = useState(...);
    // Handle interactive features
}
```

### Phase 4-5: See detailed sections below

---

### Quick Reference: Development Workflow

```
LOCAL (your machine)     →    DEVELOP (preview)    →    MAIN (production)
     │                              │                         │
     │  Test everything             │  Verify on Vercel       │  Live users
     │  here FIRST                  │  Preview URL            │  (be careful!)
     │                              │                         │
     ▼                              ▼                         ▼
Dev Database ─────────────────────────────             Prod Database
(test Supabase account)                                (main Supabase account)
```

**Golden Rule:** Never push to `develop` until it works locally. Never merge to `main` until it works on preview.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Target Architecture](#target-architecture)
4. [Why Migrate?](#why-migrate)
5. [Database Environment Setup](#database-environment-setup) *(CRITICAL)*
6. [Migration Risks](#migration-risks)
7. [Current Codebase Analysis](#current-codebase-analysis)
8. [Migration Phases](#migration-phases)
9. [Safety Measures](#safety-measures)
10. [Rollback Plan](#rollback-plan)
11. [Technical Reference](#technical-reference)

---

## Executive Summary

### What We're Doing

Migrating from **Supabase JavaScript Client** (`@supabase/supabase-js`) to **Prisma ORM** for database queries while keeping:
- Supabase PostgreSQL as the database (no data migration)
- Supabase Auth for authentication (Prisma doesn't do auth)

### Why We're Doing It

| Concern | Current State | After Prisma |
|---------|--------------|--------------|
| **Code Quality** | Supabase query syntax | Type-safe, auto-generated types |
| **Future Flexibility** | Locked to Supabase SDK | Database-agnostic queries |
| **Security** | `NEXT_PUBLIC_*` keys in browser | All queries server-side only |

### What's NOT Changing

- Database: Supabase PostgreSQL (same data, same tables)
- Authentication: Supabase Auth (cookies, sessions, middleware)
- Hosting: Vercel (production + preview)
- Git workflow: `develop` → `main`

---

## Current Architecture

### Technology Stack

```
┌─────────────────────────────────────┐
│   Next.js 16.1.1 (App Router)       │
├─────────────────────────────────────┤
│   Supabase Client Libraries         │
│   @supabase/supabase-js (v2.89.0)   │
│   @supabase/ssr (v0.8.0)            │
├─────────────────────────────────────┤
│   Supabase PostgreSQL Database      │
│   + Row-Level Security (RLS)        │
│   + Triggers & Functions            │
└─────────────────────────────────────┘
```

### Current Database Connection Methods

#### 1. Browser Client (`/src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```
- Runs in browser (client-side)
- Uses `NEXT_PUBLIC_*` environment variables (exposed to browser)
- Relies on RLS for security

#### 2. Server Client (`/src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  );
}
```
- Runs on server (API routes, Server Components)
- Manages session via cookies
- Still uses RLS

#### 3. Admin Client (`/src/lib/supabase/server.ts`)
```typescript
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```
- Bypasses RLS completely
- Uses service role key (never exposed to browser)
- Used for admin operations

### Current Environment Variables

```bash
# .env.local (current)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Exposed to browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Server only
```

### Database Schema Overview

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `profiles` | User data | References `auth.users` |
| `projects` | Content strategy containers | Owned by user |
| `nodes` | Content pieces (pillar, cluster, etc.) | Belongs to project |
| `edges` | Relationships between nodes | Links nodes |
| `articles` | Content drafts | One per node |
| `canvas_settings` | UI state persistence | One per project |
| `subscriptions` | Billing/plan management | One per user |
| `team_members` | Project collaborators | Links users to projects |
| `team_invitations` | Pending invites | Belongs to project |

### Row-Level Security (RLS) Policies

Currently, RLS handles authorization at the database level:
- Users can only access their own profile
- Users can only access projects they own or are team members of
- Nodes/edges/articles inherit access from their project
- Subscriptions are user-specific

**Important:** After Prisma migration, these checks must be implemented in application code.

---

## Target Architecture

### After Migration

```
┌─────────────────────────────────────┐
│   Next.js 16.1.1 (App Router)       │
├─────────────────────────────────────┤
│   Prisma ORM (v7.2.0)               │
│   + Auto-generated TypeScript types │
│   + Server-side only queries        │
│   + @prisma/adapter-pg driver       │
├──────────────┬──────────────────────┤
│ Supabase Auth│  PostgreSQL Database │
│ (unchanged)  │  (same data)         │
└──────────────┴──────────────────────┘
```

### New Environment Variables

```bash
# .env (after migration)

# ═══════════════════════════════════════════════════════════════
# PRISMA - Database Queries (SERVER-ONLY, never exposed to browser)
# ═══════════════════════════════════════════════════════════════
# Transaction pooler (port 6543) - for queries
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Session pooler (port 5432) - for migrations
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"

# ═══════════════════════════════════════════════════════════════
# SUPABASE AUTH - Still needed for login/signup/sessions
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # For client-side auth only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # For server-side auth admin ops
```

### Understanding the Credential Split

> **Important:** After migration, you still need Supabase credentials, but their purpose changes.

| Credential | Before (Now) | After (Prisma) |
|------------|--------------|----------------|
| `DATABASE_URL` | Not used | **Prisma queries** (server-only) |
| `DIRECT_URL` | Not used | **Prisma migrations** (server-only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + Database | **Auth only** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + Database queries | **Auth only** (login, signup) |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS bypass + admin | **Auth admin only** (maybe) |

### Why We Still Need Supabase Keys

**Prisma handles:**
- All database queries (SELECT, INSERT, UPDATE, DELETE)
- Type-safe data access
- Server-side only execution

**Prisma does NOT handle:**
- User authentication (login, signup, logout)
- Session management (cookies, JWT tokens)
- Password reset flows
- OAuth providers (Google, GitHub, etc.)

**Your app still uses Supabase Auth for:**
- `/app/(auth)/login` - User login
- `/app/(auth)/signup` - User registration
- `/app/(auth)/forgot-password` - Password reset
- `/middleware.ts` - Session refresh and route protection
- Any OAuth integrations

### The Security Improvement

```
BEFORE (Current):
┌─────────────────────────────────────────────────────────┐
│  Browser has access to:                                 │
│  • NEXT_PUBLIC_SUPABASE_URL      → Can query database   │
│  • NEXT_PUBLIC_SUPABASE_ANON_KEY → Via Supabase JS SDK  │
│  (Protected only by RLS policies)                       │
└─────────────────────────────────────────────────────────┘

AFTER (Prisma):
┌─────────────────────────────────────────────────────────┐
│  Browser has access to:                                 │
│  • NEXT_PUBLIC_SUPABASE_URL      → Auth API only        │
│  • NEXT_PUBLIC_SUPABASE_ANON_KEY → Auth API only        │
│  (Cannot query database directly - no SDK loaded)       │
├─────────────────────────────────────────────────────────┤
│  Server has access to:                                  │
│  • DATABASE_URL                  → Direct DB connection │
│  • DIRECT_URL                    → Migration connection │
│  (Never exposed to browser)                             │
└─────────────────────────────────────────────────────────┘
```

**Result:** Database credentials never reach the browser. Even if someone extracts your `NEXT_PUBLIC_*` keys, they can only access the Auth API, not your database directly.

### Query Syntax Comparison

```typescript
// BEFORE: Supabase JS
const { data, error } = await supabase
  .from('projects')
  .select('*, nodes(count)')
  .eq('user_id', userId);

// AFTER: Prisma
const projects = await prisma.project.findMany({
  where: { userId },
  include: { _count: { select: { nodes: true } } }
});
```

---

## Why Migrate?

### Motivations (Confirmed)

1. **Code Quality**
   - Prisma generates TypeScript types from schema
   - Better IDE autocomplete and error detection
   - Cleaner, more readable query syntax
   - Compile-time error catching

2. **Future Flexibility**
   - Database queries become provider-agnostic
   - Could migrate away from Supabase PostgreSQL if needed
   - Easier to test with different databases

3. **Security**
   - No `NEXT_PUBLIC_*` database credentials
   - All queries run server-side only
   - Credentials never reach the browser
   - Smaller attack surface

### What We're NOT Trying to Solve

- **SEO** - Analysis shows marketing pages are already server-rendered
- **Performance** - Current setup is adequate
- **Authentication** - Supabase Auth works well, keeping it

---

## Database Environment Setup

> **CRITICAL: Read this section before starting any migration work.**

### The Problem: Shared Database Risk

Currently, you have ONE Supabase database used by both:
- Production site (main branch)
- Preview site (develop branch)

```
┌─────────────────┐     ┌─────────────────┐
│  Production     │     │  Preview        │
│  (main branch)  │     │  (develop)      │
│  PAID USERS     │     │  TESTING        │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌─────────────┐
              │  Supabase   │
              │  (SHARED!)  │  ← DANGEROUS
              └─────────────┘
```

**Risks with shared database:**
- Test data appears in production
- Deleting test projects could delete real user data
- Testing subscription changes affects real users
- Bugs in new code could corrupt production data

### The Solution: Separate Databases

```
┌─────────────────┐     ┌─────────────────┐
│  Production     │     │  Preview        │
│  (main branch)  │     │  (develop)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Supabase       │     │  Supabase       │
│  PRODUCTION     │     │  DEVELOPMENT    │
│  (paid users)   │     │  (safe testing) │
└─────────────────┘     └─────────────────┘
```

### Step-by-Step: Create Development Database

#### 1. Create New Supabase Project

> **Note:** You can create this project under a different Supabase account (different email).
> This provides complete isolation and gives you free tier on both accounts.

**Option A: Use existing test account (recommended if you have one)**
1. Log in to your test Supabase account
2. Click **"New Project"**

**Option B: Use same account as production**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**

**Project Settings:**
- Name: `syncseo-development` (or your preferred name)
- Database Password: Generate a strong password (save it!)
- Region: Same as production for consistency (reduces latency when copying schemas)

Wait for project to initialize (~2 minutes)

#### 2. Get Connection Details

From your NEW development project dashboard:

1. Go to **Settings → Database**
2. Copy these values:
   - Host: `aws-0-[region].pooler.supabase.com`
   - Database name: `postgres`
   - Port: `6543` (transaction mode) / `5432` (session mode)
   - User: `postgres.[project-ref]`
   - Password: (the one you created)

3. Go to **Settings → API**
4. Copy these values:
   - Project URL: `https://[ref].supabase.co`
   - Anon public key: `eyJ...`
   - Service role key: `eyJ...`

#### 3. Apply Schema to Development Database

Your project has SQL migration files. Run them in order on the new database.

**Option A: Using Supabase SQL Editor**

1. Go to development project → SQL Editor
2. Copy and paste each file's contents in order:

```
1. supabase-schema.sql
2. supabase-business-tables.sql
3. supabase-articles-migration.sql
4. supabase-allow-multi-edges.sql
5. supabase-seo-edge-types.sql
6. supabase-storage-migration.sql
7. supabase-fix-signup.sql
8. supabase-handle-persistence.sql
```

3. Click "Run" after each one

**Option B: Using psql (command line)**

```bash
# Connect to development database
psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Run each migration
\i supabase-schema.sql
\i supabase-business-tables.sql
# ... etc
```

#### 4. Configure Vercel Environment Variables

Go to Vercel → Project → Settings → Environment Variables

> **Note:** Development and Production can use completely different Supabase accounts.
> It doesn't matter if they're under different emails - only the credentials matter.

**For Production (select "Production" environment):**
```bash
# ─── SUPABASE AUTH (for login/signup/sessions) ───
NEXT_PUBLIC_SUPABASE_URL = https://[PROD-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [PROD-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [PROD-service-key]

# ─── PRISMA DATABASE (add in Phase 1) ───
# Transaction pooler (port 6543) - for queries
DATABASE_URL = postgresql://postgres.[PROD-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
# Session pooler (port 5432) - for migrations
DIRECT_URL = postgresql://postgres.[PROD-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**For Preview (select "Preview" environment):**
```bash
# ─── SUPABASE AUTH (for login/signup/sessions) ───
# Can be from a completely different Supabase account!
NEXT_PUBLIC_SUPABASE_URL = https://[DEV-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [DEV-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [DEV-service-key]

# ─── PRISMA DATABASE (add in Phase 1) ───
# Transaction pooler (port 6543) - for queries
DATABASE_URL = postgresql://postgres.[DEV-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
# Session pooler (port 5432) - for migrations
DIRECT_URL = postgresql://postgres.[DEV-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Where to find these values in Supabase:**

| Variable | Location in Supabase Dashboard |
|----------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role |
| `DATABASE_URL` | Settings → Database → Connection string → Transaction pooler (port 6543) |
| `DIRECT_URL` | Settings → Database → Connection string → Session pooler (port 5432) |

#### 5. Configure Local Development

Update your local `.env.local` to use the DEVELOPMENT database:

```bash
# ═══════════════════════════════════════════════════════════════
# .env.local (for local development - uses DEV database)
# ═══════════════════════════════════════════════════════════════

# ─── SUPABASE AUTH (still needed for login/signup) ───
NEXT_PUBLIC_SUPABASE_URL=https://[DEV-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEV-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[DEV-service-key]

# ─── PRISMA DATABASE (add when starting Phase 1) ───
DATABASE_URL="postgresql://postgres.[DEV-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[DEV-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# ─── OTHER SERVICES (copy from existing .env.local) ───
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
# BREVO_API_KEY=...
# etc.
```

#### 6. Create Test Data

In your development database, create test accounts:
- Test user with Free plan
- Test user with Pro plan
- Test user with Agency plan
- Test team scenarios

This data is isolated - it won't appear in production.

### Verification Checklist

Before starting migration work:

- [ ] Development Supabase project created
- [ ] All schema migrations applied to dev database
- [ ] Vercel Preview environment uses dev database credentials
- [ ] Vercel Production environment uses prod database credentials
- [ ] Local `.env.local` uses dev database
- [ ] Test accounts created in dev database
- [ ] Verified: Changes in dev don't appear in prod
- [ ] Verified: Preview deployments connect to dev database

### Cost Considerations

- Supabase Free tier: 2 projects per organization
- **Different accounts:** You can use a completely separate Supabase account (different email) for development - this gives you 2 free projects on each account
- If same account and need more: Pro plan ($25/month per project)
- Development database can be smaller/cheaper tier

### Using Different Supabase Accounts

You can use separate Supabase accounts for production and development:

```
Production Account (email1@example.com)
└── syncseo-production project

Development Account (email2@example.com)
└── syncseo-development project
```

**Benefits:**
- Complete isolation between environments
- Separate billing
- No risk of accidentally affecting production
- Free tier on each account

**This works because:** Supabase doesn't care which account owns a project. Your app only needs the connection strings and API keys - it doesn't matter which email owns the project.

---

## Migration Risks

### Risk Assessment Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Breaking paid user subscriptions | HIGH | Medium | Test Stripe flows extensively |
| Missing authorization checks | HIGH | Medium | Audit every endpoint |
| Data inconsistency during transition | HIGH | Low | No data migration needed |
| Team access control bugs | MEDIUM | Medium | Compare results before/after |
| Canvas editor data loss | MEDIUM | Low | Test save/load thoroughly |
| Session/auth issues | MEDIUM | Low | Auth system unchanged |
| Deployment downtime | LOW | Low | Zero-downtime deployment |

### Critical Areas Requiring Extra Testing

1. **Subscription Management**
   - Plan upgrades/downgrades
   - Stripe webhook handlers
   - Usage limit calculations

2. **Team Collaboration**
   - Adding/removing team members
   - Role-based permissions
   - Invitation flow

3. **Project Data**
   - Creating/deleting projects
   - Canvas state persistence
   - Node/edge operations

4. **Article Editor**
   - Auto-save functionality
   - Content persistence
   - Rich text formatting

---

## Current Codebase Analysis

### Supabase Import Distribution

**Client-side imports: 27 files**
```
src/app/(auth)/* - Login, signup, password reset
src/app/(dashboard)/* - All dashboard pages
src/components/canvas/* - Canvas editor
src/components/editor/* - Article editor
src/components/team/* - Team management
src/app/(marketing)/pricing/* - Pricing page
```

**Server-side imports: 18 files**
```
src/app/api/* - All API routes (22 handlers)
src/middleware.ts - Session management
```

### Files That Will Change

| Category | Files | Complexity |
|----------|-------|------------|
| API Routes | 22 | Medium - straightforward conversion |
| Dashboard Pages | 15 | High - need Server Component refactor |
| Client Components | 27 | High - data fetching pattern change |
| Utility Files | 3 | Low - type updates |

### SEO Status (No Action Needed)

| Page Type | Current Rendering | SEO Status |
|-----------|------------------|------------|
| Marketing pages | Server Components | Good |
| Solutions pages | Server Components | Good |
| Resources pages | Server Components | Good |
| Dashboard pages | Client-side | N/A (behind auth) |

---

## Migration Phases

### Phase 1: Parallel Setup (No Risk)

**Goal:** Add Prisma alongside Supabase without changing any existing functionality.

**Tasks:**
1. Install Prisma dependencies
   ```bash
   npm install prisma @prisma/client
   npm install -D prisma
   ```

2. Initialize Prisma
   ```bash
   npx prisma init
   ```

3. Configure database connection
   ```bash
   # .env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

4. Introspect existing database (generate schema from Supabase)
   ```bash
   npx prisma db pull
   ```

5. Generate Prisma Client
   ```bash
   npx prisma generate
   ```

6. Create Prisma client singleton (`/src/lib/prisma.ts`)

7. Write comparison tests (Supabase vs Prisma queries)

**Deliverables:**
- [ ] Prisma schema file (`prisma/schema.prisma`)
- [ ] Prisma client singleton
- [ ] Test file comparing query results
- [ ] Documentation of any schema differences

**Development Flow:**
```
1. LOCAL FIRST
   ├── Create feature branch from develop
   ├── Add Prisma packages
   ├── Configure .env.local with DEV database
   ├── Run prisma db pull
   ├── Test locally: npm run dev
   └── Verify app still works (Supabase queries unchanged)

2. PUSH TO DEVELOP (only after local works)
   ├── git push origin feature/prisma-setup
   ├── Create PR to develop
   ├── Merge to develop
   └── Vercel builds preview

3. TEST ON PREVIEW
   └── Verify preview deployment works
```

**Branch:** Feature branch → `develop`
**Test on:** Local first, then Preview environment

---

### Phase 2: API Routes Migration (Low Risk)

**Goal:** Convert server-side API routes from Supabase to Prisma.

**Why Low Risk:** API routes already run on server, similar pattern.

**Order of Migration:**

1. **Read-only routes first** (lowest risk)
   - `GET /api/projects`
   - `GET /api/limits`
   - `GET /api/team`

2. **Write routes** (medium risk)
   - `POST /api/projects`
   - `PUT /api/projects/[id]`
   - `DELETE /api/projects/[id]`

3. **Complex routes** (higher risk)
   - `/api/billing/*` (Stripe integration)
   - `/api/invitations/*`
   - `/api/admin/*`

**Authorization Pattern:**

```typescript
// BEFORE: RLS handles automatically
const { data } = await supabase.from('projects').select();

// AFTER: Must check manually
const user = await getAuthUser(); // From Supabase Auth
const projects = await prisma.project.findMany({
  where: {
    OR: [
      { userId: user.id },
      { teamMembers: { some: { userId: user.id } } }
    ]
  }
});
```

**Deliverables:**
- [ ] All API routes using Prisma
- [ ] Authorization helper functions
- [ ] Integration tests for each route
- [ ] Performance comparison

**Development Flow:** Local testing → Push to develop → Test on Preview
**Branch:** Feature branch → `develop`

---

### Phase 3: Server Components (Medium Risk)

**Goal:** Convert data-fetching client components to Server Components.

**Pattern Change:**

```typescript
// BEFORE: Client Component with useEffect
'use client';
export function ProjectsList() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);
  return <div>{projects.map(...)}</div>;
}

// AFTER: Server Component
export async function ProjectsList() {
  const projects = await prisma.project.findMany({...});
  return <div>{projects.map(...)}</div>;
}
```

**Components to Convert:**

| Component | Current | After |
|-----------|---------|-------|
| Dashboard layout | Client + useEffect | Server Component |
| Projects list | Client + fetch | Server Component |
| Project page wrapper | Client + useEffect | Server Component |
| Team members list | Client + fetch | Server Component |

**Deliverables:**
- [ ] Server Components for data fetching
- [ ] Client Components for interactivity only
- [ ] Proper Suspense boundaries
- [ ] Loading states

**Development Flow:** Local testing → Push to develop → Test on Preview
**Branch:** Feature branch → `develop`

---

### Phase 4: Client Components Refactor (Complete)

**Goal:** Restructure remaining client components to receive data as props.

**Progress Table:**

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Migrate /team dashboard page | ✅ Done | Jan 20, 2026 | Split into Server + Client components |
| Migrate /admin page | ✅ Done | Jan 20, 2026 | Split into Server + Client components |
| Migrate /settings/layout.tsx | ✅ Done | Jan 20, 2026 | Fetches subscription for team access |
| Migrate /checkout/success page | ⏭️ Skipped | Jan 20, 2026 | Side-effect based, must stay client |
| Migrate /project/[id] page | ✅ Done | Jan 20, 2026 | Fetches project, role, articles server-side |
| Migrate articles-list.tsx | ✅ Done | Jan 20, 2026 | Receives initialArticles from server |
| Migrate team-panel.tsx | ⏭️ Skipped | Jan 20, 2026 | Dead code - not used anywhere |
| Migrate node-detail-panel.tsx | ✅ Done | Jan 20, 2026 | Domain passed through props chain |
| Migrate article-editor.tsx | ✅ Done | Jan 20, 2026 | Page fetches all data server-side |

**Files Changed/Created:**

**`/team/page.tsx`** - Converted to Server Component
- Server Component fetches team members, projects, subscription
- Created `team-content.tsx` client component for interactions
- Role changes and project toggles still use API endpoints

**`/admin/page.tsx`** - Converted to Server Component
- Server Component fetches all users and stats with Prisma
- Created `admin-content.tsx` client component for search, filter, delete
- Requires super admin authorization

**`/settings/layout.tsx`** - Converted to Server Component
- Fetches subscription to determine team access server-side
- Created `settings-nav.tsx` client component (needs usePathname)

**`/project/[id]/page.tsx`** - Converted to Server Component
- Fetches project data, user role, and articles server-side
- Passes initialProject, initialUserRole, initialArticles to client

**`/components/project/project-page-client.tsx`** - Updated
- Now receives initialProject, initialUserRole, initialArticles as props
- Removed useEffect data fetching
- Passes projectDomain to CanvasEditor

**`/components/project/articles-list.tsx`** - Updated
- Now receives initialArticles as prop
- Removed useEffect initial load

**`/components/canvas/canvas-editor.tsx`** - Updated
- Now accepts projectDomain prop
- Uses prop instead of fetching domain if provided
- Passes domain to NodeDetailPanel

**`/components/canvas/node-detail-panel.tsx`** - Simplified
- Removed useEffect fallback for domain fetch
- Uses projectDomain prop directly

**`/project/[id]/article/[nodeId]/page.tsx`** - Converted to Server Component
- Fetches project, node, article, available nodes, user role
- Checks public sharing capability server-side
- Passes all data to ArticleEditor as props

**`/components/editor/article-editor.tsx`** - Updated
- Accepts initial data props from Server Component
- Falls back to client-side fetch if props not provided (backwards compatible)
- Maintains all interactive functionality (auto-save, keyboard shortcuts)

**`/lib/types/index.ts`** - Updated
- Added is_public and share_id fields to ContentNode type

**Components Analysis:**
- `team-panel.tsx` - Dead code (not imported anywhere), skipped
- Canvas editor - Receives domain via props chain, complex client interactions remain client-side
- Article editor - Page fetches data, editor receives as props

**Pattern:**

```typescript
// Server Component (parent)
export default async function ArticlePage({ params }) {
  const project = await prisma.projects.findUnique({...});
  const node = await prisma.nodes.findUnique({...});
  const article = await prisma.articles.findUnique({...});
  return <ArticleEditor initialProject={project} initialNode={node} initialArticle={article} />;
}

// Client Component (child)
'use client';
export function ArticleEditor({ initialProject, initialNode, initialArticle }) {
  const [project] = useState(initialProject);
  // Interactive logic, auto-save, keyboard shortcuts
}
```

**Deliverables:**
- [x] All components refactored
- [x] Data flow documented
- [x] Build verification passed
- [ ] User acceptance testing

**Development Flow:** Local testing → Push to develop → Test on Preview
**Branch:** Feature branch → `develop`

---

### Phase 5: Preview Testing & Production Deploy (Final)

**Goal:** Test on Vercel Preview with team, then deploy to production when ready.

**Architecture Decision:** Hybrid approach (Prisma for reads, Supabase for writes)
- Server Components use Prisma for initial data fetching
- Client Components use Supabase for mutations (saves, updates)
- Authentication stays with Supabase Auth
- This provides best of both worlds: SEO + real-time updates

**Tasks:**
1. ✅ Server Components migrated to Prisma
2. ✅ Keep Supabase for client-side mutations
3. ✅ Keep `@supabase/ssr` for authentication
4. ⬚ Add Vercel Preview environment variables (DATABASE_URL, DIRECT_URL)
5. ⬚ Push to develop branch
6. ⬚ Test on Vercel Preview with team
7. ⬚ Merge develop → main (when team approves)

**Vercel Preview Environment Variables:**
```
# Add these to Vercel → Settings → Environment Variables → Preview
DATABASE_URL=postgresql://postgres.xbylfjiyyalqcqqnjcju:hZcc40%2B612%5Bp@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xbylfjiyyalqcqqnjcju:hZcc40%2B612%5Bp@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Pre-Production Checklist:**
- [ ] Vercel Preview environment variables added
- [ ] Push to develop branch
- [ ] Manual testing on Preview URL:
  - [ ] Dashboard loads with correct stats
  - [ ] Projects list shows all projects
  - [ ] Project detail shows articles
  - [ ] Article editor loads content
  - [ ] Canvas editor works
  - [ ] Auto-save works
  - [ ] Team features work
  - [ ] Stripe checkout works
- [ ] Team approval received
- [ ] No console errors
- [ ] Performance acceptable

**Deployment to Production:**
1. Team approves Preview testing
2. Merge `develop` → `main`
3. Vercel auto-deploys to production
4. Monitor for errors
5. Rollback plan: revert merge if issues

---

## Safety Measures

### Development Workflow

> **Golden Rule:** Test locally first. Only push to `develop` when it works on your machine.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LOCAL DEVELOPMENT          2. DEVELOP BRANCH         3. PRODUCTION     │
│  ───────────────────          ─────────────────          ──────────────    │
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐ │
│  │  Your Machine   │         │  Vercel Preview │       │ Vercel Prod     │ │
│  │  localhost:3000 │  ────►  │  (develop)      │ ────► │ (main)          │ │
│  │                 │  push   │                 │ merge │                 │ │
│  │  Dev Database   │         │  Dev Database   │       │ Prod Database   │ │
│  └─────────────────┘         └─────────────────┘       └─────────────────┘ │
│         │                           │                         │            │
│         ▼                           ▼                         ▼            │
│   Test everything            Verify on real               Live users      │
│   locally FIRST              Vercel environment           (careful!)       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Development Process

#### Step 1: Work Locally (Your Machine)

```bash
# Make sure .env.local points to DEV database
# Start local development server
npm run dev

# Test your changes at localhost:3000
# - Test all affected features
# - Check console for errors
# - Verify data operations work
```

**Before pushing, verify locally:**
- [ ] App starts without errors
- [ ] Can log in / sign up (new test user)
- [ ] Can create/edit/delete projects
- [ ] Canvas editor works
- [ ] Article editor works
- [ ] Team features work (if applicable)
- [ ] No console errors

#### Step 2: Push to Develop Branch

```bash
# Only after local testing passes!
git add .
git commit -m "feat: migrate X to Prisma"
git push origin develop
```

**What happens:**
1. Vercel detects push to `develop`
2. Builds preview deployment
3. Uses Preview environment variables (Dev database)
4. Generates preview URL

#### Step 3: Test on Vercel Preview

```bash
# Vercel provides a preview URL like:
# https://syncseo-abc123-yourteam.vercel.app
```

**Test on preview environment:**
- [ ] All features work on real Vercel hosting
- [ ] No build errors
- [ ] No runtime errors
- [ ] Performance acceptable

#### Step 4: Merge to Main (Only When Ready)

```bash
# Only after preview testing passes!
git checkout main
git merge develop
git push origin main
```

**What happens:**
1. Vercel detects push to `main`
2. Builds production deployment
3. Uses Production environment variables (Prod database)
4. Deploys to production URL

### Why Local Testing First?

| Issue Found | Local | Preview | Production |
|-------------|-------|---------|------------|
| Time to fix | Instant | Minutes | Minutes + stress |
| User impact | None | None | Paid users affected |
| Rollback needed | No | Maybe | Yes |
| Embarrassment | None | Low | High |

**Local testing catches:**
- Syntax errors
- Import errors
- Basic logic bugs
- Database query issues
- Type errors

**Preview testing catches:**
- Environment variable issues
- Build/bundle problems
- Vercel-specific issues
- Edge cases

### Testing Requirements

1. **Unit Tests**
   - Each Prisma query matches Supabase result
   - Authorization checks work correctly

2. **Integration Tests**
   - API routes return correct data
   - Mutations persist correctly

3. **E2E Tests**
   - User can sign up/login
   - User can create/edit projects
   - User can manage team
   - Subscription flows work
   - Canvas saves/loads correctly

### Environment Separation

| Environment | Branch | Database | Purpose | When to Use |
|-------------|--------|----------|---------|-------------|
| **Local** | any | Dev Supabase | Development | Always start here |
| **Preview** | develop | Dev Supabase | Staging | After local works |
| **Production** | main | Prod Supabase | Live users | After preview works |

**Data Flow:**
```
Dev Database (test account)          Prod Database (main account)
         │                                     │
         ├── Local development                 │
         └── Vercel Preview                    └── Vercel Production
             (develop branch)                      (main branch)
```

### Feature Flags (Optional)

If extra safety needed:
```typescript
const USE_PRISMA = process.env.USE_PRISMA === 'true';

if (USE_PRISMA) {
  return await prismaQuery();
} else {
  return await supabaseQuery();
}
```

---

## Rollback Plan

### If Issues in Preview (develop)
1. Revert commits on `develop`
2. Redeploy preview
3. Investigate and fix

### If Issues in Production (main)
1. **Immediate:** Revert merge commit on `main`
2. **Vercel:** Auto-redeploys previous version
3. **Database:** No changes needed (same database)
4. **Users:** Minimal disruption (< 5 minutes)

### Rollback Command
```bash
git revert <merge-commit-hash>
git push origin main
```

---

## Technical Reference

### Prisma Schema (Prisma 7)

After running `prisma db pull`, the schema uses the new Prisma 7 format:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  schemas  = ["auth", "public"]  // multiSchema is now stable
}

// prisma.config.ts handles the URL for migrations:
// import { defineConfig } from "prisma/config";
// export default defineConfig({
//   datasource: { url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"] }
// });

model Profile {
  id visitorId          String   @id @default(uuid()) @db.Uuid
  email           String?
  fullName        String?  @map("full_name")
  avatarUrl       String?  @map("avatar_url")
  stripeCustomerId String? @map("stripe_customer_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  projects        Project[]
  subscriptions   Subscription?
  teamMembers     TeamMember[]

  @@map("profiles")
}

model Project {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  name        String
  description String?
  websiteUrl  String?  @map("website_url")
  domain      String?
  color       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        Profile  @relation(fields: [userId], references: [id])
  nodes       Node[]
  edges       Edge[]
  articles    Article[]
  canvasSettings CanvasSettings?
  teamMembers TeamMember[]

  @@map("projects")
}

// ... additional models
```

### Prisma Client Singleton (Prisma 7)

```typescript
// /src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Note:** Prisma 7 requires a driver adapter (`@prisma/adapter-pg`) instead of embedding the URL in the schema.

### Authorization Helper

```typescript
// /src/lib/auth/authorize.ts
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function authorizeProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId },
        { teamMembers: { some: { userId } } }
      ]
    }
  });
  if (!project) throw new Error('Forbidden');
  return project;
}
```

### Supabase Connection Strings

Get from Supabase Dashboard → Settings → Database:

```
# Transaction mode (for Prisma queries)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (for migrations)
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

---

## Appendix: Files Inventory

### API Routes to Migrate

| Route | Method | Complexity | Notes |
|-------|--------|------------|-------|
| `/api/projects` | GET | Medium | Multi-query aggregation |
| `/api/projects` | POST | Low | Single insert |
| `/api/projects/[id]` | GET | Low | Single query |
| `/api/projects/[id]` | PUT | Low | Single update |
| `/api/projects/[id]` | DELETE | Medium | Cascade deletes |
| `/api/projects/[id]/team` | GET/POST | Medium | Team management |
| `/api/team` | GET | Medium | User's team memberships |
| `/api/limits` | GET | Medium | Usage calculations |
| `/api/billing/*` | Various | High | Stripe integration |
| `/api/invitations/*` | Various | Medium | Token handling |
| `/api/admin/*` | Various | High | Admin operations |

### Components Using Supabase Client

See full list in codebase analysis section above.

---

## Final Architecture (January 20, 2026)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYNCSEO FINAL ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MARKETING PAGES (Static)                                                   │
│  ─────────────────────────                                                  │
│  • Home page (/)           → No database queries (CDN cached)               │
│  • Pricing (/pricing)      → 1 small auth check                             │
│  • Solutions, Resources    → Fully static (CDN cached)                      │
│  • Legal pages             → Fully static (CDN cached)                      │
│  🎯 Result: Excellent SEO, fast Core Web Vitals                             │
│                                                                             │
│  DASHBOARD PAGES (Server Components + Prisma)                               │
│  ─────────────────────────────────────────────────────────────              │
│  • Dashboard               → Prisma: projects, articles, nodes count        │
│  • Projects list           → Prisma: projects, subscriptions, counts        │
│  • Project detail          → Prisma: project, role, articles                │
│  • Article editor          → Prisma: project, node, article, nodes          │
│  • Team management         → Prisma: team members, projects                 │
│  • Admin panel             → Prisma: all users, stats                       │
│  • Settings                → Prisma: subscription, profile                  │
│  🎯 Result: Server-side rendering, full database control                    │
│                                                                             │
│  CLIENT INTERACTIONS (Supabase JS - Mutations)                              │
│  ─────────────────────────────────────────────────────────────              │
│  • Article auto-save       → Supabase: upsert articles                      │
│  • Canvas node CRUD        → Supabase: insert/update/delete nodes           │
│  • Canvas edge CRUD        → Supabase: insert/update/delete edges           │
│  • Project create/edit     → Supabase: insert/update projects               │
│  • Profile updates         → Supabase: update profiles                      │
│  • Image uploads           → Supabase Storage                               │
│  🎯 Result: Responsive UI, real-time updates                                │
│                                                                             │
│  AUTHENTICATION (Supabase Auth - Always)                                    │
│  ─────────────────────────────────────────────────────────────              │
│  • Login/Signup            → Supabase Auth                                  │
│  • Password reset          → Supabase Auth                                  │
│  • Session management      → Supabase Auth (@supabase/ssr)                  │
│  🎯 Result: Battle-tested auth, secure sessions                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Page-by-Page Data Source

| Page | Initial Data | Method | Full Control? |
|------|-------------|--------|---------------|
| `/` (Home) | None (static) | - | N/A |
| `/pricing` | Auth check only | Supabase Auth | N/A |
| `/dashboard` | Projects, counts | **Prisma** | ✅ Yes |
| `/projects` | Projects, limits | **Prisma** | ✅ Yes |
| `/project/[id]` | Project, role, articles | **Prisma** | ✅ Yes |
| `/project/[id]/article/[nodeId]` | Project, node, article | **Prisma** | ✅ Yes |
| `/team` | Team members, projects | **Prisma** | ✅ Yes |
| `/admin` | All users, stats | **Prisma** | ✅ Yes |
| `/settings/*` | Subscription, profile | **Prisma** | ✅ Yes |

### Scalability

This architecture is **highly scalable** for adding new SaaS features:

1. **Clear Pattern**: Server Component (Prisma) → Client Component (UI)
2. **Separation of Concerns**: Data (Prisma), Auth (Supabase), UI (React)
3. **Type Safety**: Prisma generates TypeScript types from schema
4. **Easy Migrations**: `npx prisma migrate dev` for schema changes
5. **Performance**: Server-side fetching, CDN caching for static pages

**Example: Adding a new feature (Analytics Dashboard)**
```
1. Update prisma/schema.prisma → add analytics tables
2. npx prisma migrate dev → apply migration
3. Create /app/(dashboard)/analytics/page.tsx → Server Component with Prisma
4. Create /components/analytics/charts.tsx → Client Component for interactivity
```

### Security Benefits (Prisma vs Supabase JS)

| Aspect | Before (Supabase JS) | After (Prisma) |
|--------|---------------------|----------------|
| Credentials in browser | Yes (NEXT_PUBLIC_*) | **No** (server only) |
| Row Level Security needed | Yes (must configure) | **No** (server controls) |
| API exposure | Public API endpoint | **No public endpoint** |
| Attack surface | Larger | **Smaller** |

### Vercel Environment Variables (Preview)

**Required for Prisma:**
```
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Keep existing (for Auth & Client mutations):**
```
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| Jan 20, 2026 | Claude + Dev | Initial document created |
| Jan 20, 2026 | Claude + Dev | Phase 1-4 completed |
| Jan 20, 2026 | Claude + Dev | Final architecture documented |

---

## Next Steps

1. ~~Review this document~~  ✅
2. ~~Confirm decision to proceed~~ ✅
3. ~~Complete Phase 1-4~~ ✅
4. **Add Vercel Preview environment variables** (DATABASE_URL, DIRECT_URL)
5. **Push to develop branch**
6. **Test on Vercel Preview with team**
7. When ready: Merge develop → main (production)
