# SyncSEO Application Architecture

> **Last Updated:** January 20, 2026
> **Tech Stack:** Next.js 15, React 19, Prisma ORM, Supabase Auth, TypeScript
> **Deployment:** Vercel

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Directory Structure](#directory-structure)
5. [Page-by-Page Data Sources](#page-by-page-data-sources)
6. [Adding New Features](#adding-new-features)
7. [Security Model](#security-model)
8. [Database Schema](#database-schema)
9. [Authentication Flow](#authentication-flow)
10. [Environment Variables](#environment-variables)
11. [Scalability](#scalability)

---

## Architecture Overview

SyncSEO uses a **hybrid architecture** that combines the best of Server Components and Client Components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYNCSEO ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────────────┐                            │
│                              │     VERCEL      │                            │
│                              │   (Hosting)     │                            │
│                              └────────┬────────┘                            │
│                                       │                                     │
│                    ┌──────────────────┼──────────────────┐                  │
│                    │                  │                  │                  │
│                    ▼                  ▼                  ▼                  │
│           ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│           │   MARKETING   │  │   DASHBOARD   │  │     API       │          │
│           │    PAGES      │  │    PAGES      │  │   ROUTES      │          │
│           │   (Static)    │  │   (Dynamic)   │  │  (Dynamic)    │          │
│           └───────────────┘  └───────┬───────┘  └───────┬───────┘          │
│                                      │                  │                  │
│                                      ▼                  ▼                  │
│                              ┌───────────────────────────────┐             │
│                              │      SERVER COMPONENTS        │             │
│                              │   (Data Fetching with Prisma) │             │
│                              └───────────────┬───────────────┘             │
│                                              │                             │
│                    ┌─────────────────────────┼─────────────────────────┐   │
│                    │                         │                         │   │
│                    ▼                         ▼                         ▼   │
│           ┌───────────────┐         ┌───────────────┐         ┌──────────┐│
│           │    PRISMA     │         │   SUPABASE    │         │ SUPABASE ││
│           │   (Database)  │         │    (Auth)     │         │ (Storage)││
│           └───────┬───────┘         └───────┬───────┘         └────┬─────┘│
│                   │                         │                      │      │
│                   └─────────────────────────┼──────────────────────┘      │
│                                             │                             │
│                                             ▼                             │
│                                    ┌───────────────┐                      │
│                                    │   SUPABASE    │                      │
│                                    │   POSTGRES    │                      │
│                                    │   DATABASE    │                      │
│                                    └───────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Server Components for Data Fetching**: All initial page data is fetched server-side using Prisma
2. **Client Components for Interactivity**: User interactions (forms, buttons, real-time updates) handled client-side
3. **Supabase for Auth Only**: Authentication uses Supabase Auth, not database queries
4. **Type Safety**: Prisma generates TypeScript types from the database schema

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React Framework (App Router) | 15.x |
| React | UI Library | 19.x |
| TypeScript | Type Safety | 5.x |
| Tailwind CSS | Styling | 3.x |
| Lucide React | Icons | Latest |
| React Flow | Canvas Editor | 11.x |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Prisma ORM | Database Access (Server) | 6.x |
| Supabase Auth | Authentication | Latest |
| Supabase Storage | File Uploads | Latest |
| Next.js API Routes | REST API Endpoints | 15.x |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Vercel | Hosting & Deployment |
| Supabase | PostgreSQL Database & Auth |
| Stripe | Payment Processing |
| Brevo | Transactional Email |

---

## Data Flow Architecture

### Pattern: Server Component → Client Component

```typescript
// 1. SERVER COMPONENT (page.tsx) - Fetches data with Prisma
// Location: /app/(dashboard)/projects/page.tsx

import { prisma } from '@/lib/prisma';

export default async function ProjectsPage() {
    // Server-side data fetching (runs on server only)
    const projects = await prisma.projects.findMany({
        where: { user_id: userId },
        orderBy: { updated_at: 'desc' },
    });

    // Pass data to Client Component as props
    return <ProjectsPageContent initialProjects={projects} />;
}
```

```typescript
// 2. CLIENT COMPONENT (projects-content.tsx) - Handles interactivity
// Location: /app/(dashboard)/projects/projects-content.tsx

'use client';

export function ProjectsPageContent({ initialProjects }) {
    const [projects, setProjects] = useState(initialProjects);

    // Client-side interactions (modals, forms, etc.)
    const handleCreateProject = async () => {
        // Uses Supabase or API routes for mutations
    };

    return <div>...</div>;
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER REQUEST                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SERVER COMPONENT (page.tsx)                      │   │
│  │                                                                      │   │
│  │  1. Check authentication (Supabase Auth)                            │   │
│  │  2. Fetch data (Prisma)                                             │   │
│  │  3. Pass data as props to Client Component                          │   │
│  │                                                                      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLIENT COMPONENT (content.tsx)                    │   │
│  │                                                                      │   │
│  │  1. Receive initial data as props (no loading state needed)         │   │
│  │  2. Manage local state for UI interactions                          │   │
│  │  3. Handle user actions (create, update, delete)                    │   │
│  │  4. Call API routes or Supabase for mutations                       │   │
│  │                                                                      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         USER SEES PAGE                               │   │
│  │                                                                      │   │
│  │  • Content pre-rendered in HTML (SEO friendly)                      │   │
│  │  • No loading spinners for initial data                             │   │
│  │  • Interactive elements work immediately                            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, signup, etc.)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── projects/
│   │   │   ├── page.tsx          # Server Component
│   │   │   └── projects-content.tsx  # Client Component
│   │   ├── project/[id]/
│   │   │   ├── page.tsx          # Project detail
│   │   │   └── article/[nodeId]/page.tsx
│   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   ├── profile/
│   │   │   ├── billing/
│   │   │   ├── subscription/
│   │   │   └── team/
│   │   ├── team/page.tsx         # Team management
│   │   └── admin/page.tsx        # Admin panel
│   │
│   ├── (marketing)/              # Public marketing pages
│   │   ├── pricing/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── solutions/
│   │   ├── resources/
│   │   └── legal/
│   │
│   ├── api/                      # API Routes
│   │   ├── projects/
│   │   ├── billing/
│   │   ├── team/
│   │   ├── admin/
│   │   └── webhooks/
│   │
│   └── page.tsx                  # Home page
│
├── components/                   # React Components
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── canvas/                   # Canvas editor components
│   │   ├── canvas-editor.tsx
│   │   ├── node-detail-panel.tsx
│   │   └── ...
│   ├── editor/                   # Article editor components
│   │   ├── article-editor.tsx
│   │   ├── rich-text-editor.tsx
│   │   └── ...
│   ├── dashboard/                # Dashboard components
│   ├── project/                  # Project components
│   └── marketing/                # Marketing components
│
├── lib/                          # Shared utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── stripe/
│   │   └── config.ts             # Stripe configuration
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── utils/
│       ├── helpers.ts
│       ├── constants.ts
│       └── roles.ts
│
└── prisma/
    └── schema/
        └── schema.prisma         # Database schema
```

---

## Page-by-Page Data Sources

### Marketing Pages (Static - No Database)

| Page | Path | Data Source | Notes |
|------|------|-------------|-------|
| Home | `/` | None | Fully static, CDN cached |
| Pricing | `/pricing` | Auth check only | Checks if user logged in |
| Contact | `/contact` | None | Form submits to API |
| Solutions | `/solutions/*` | None | Static marketing content |
| Resources | `/resources/*` | None | Static content |
| Legal | `/legal/*` | None | Static legal pages |

### Dashboard Pages (Server Components + Prisma)

| Page | Path | Prisma Queries | Client Component |
|------|------|----------------|------------------|
| Dashboard | `/dashboard` | projects, nodes.count, articles.count | None (static render) |
| Projects | `/projects` | projects, subscriptions, team_members | `projects-content.tsx` |
| Project Detail | `/project/[id]` | projects, nodes, team_members | `project-page-client.tsx` |
| Article Editor | `/project/[id]/article/[nodeId]` | projects, nodes, articles | `article-editor.tsx` |
| Team | `/team` | team_members, projects | `team-content.tsx` |
| Admin | `/admin` | profiles, projects, subscriptions | `admin-content.tsx` |
| Settings | `/settings/*` | subscriptions, profiles | Various content components |

### API Routes (Prisma for reads, Supabase for auth)

| Route | Method | Purpose | Data Layer |
|-------|--------|---------|------------|
| `/api/projects` | GET | List user's projects | Prisma |
| `/api/projects` | POST | Create project | Prisma |
| `/api/projects/[id]` | PUT/DELETE | Update/delete project | Prisma |
| `/api/billing/*` | Various | Stripe operations | Prisma + Stripe |
| `/api/team/*` | Various | Team management | Prisma |
| `/api/admin/*` | Various | Admin operations | Prisma |

---

## Adding New Features

### Step-by-Step Guide

Follow this pattern when adding any new feature:

#### Step 1: Database Schema (if needed)

```prisma
// prisma/schema/schema.prisma

model analytics {
    id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    project_id  String   @db.Uuid
    page_views  Int      @default(0)
    created_at  DateTime @default(now()) @db.Timestamptz(6)

    projects    projects @relation(fields: [project_id], references: [id], onDelete: Cascade)
}
```

Run migration:
```bash
npx prisma migrate dev --name add_analytics
```

#### Step 2: TypeScript Types

```typescript
// src/lib/types/index.ts

export interface Analytics {
    id: string;
    project_id: string;
    page_views: number;
    created_at: string;
}
```

#### Step 3: Server Component (Page)

```typescript
// src/app/(dashboard)/analytics/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AnalyticsContent } from './analytics-content';

export default async function AnalyticsPage() {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Fetch data with Prisma
    const analytics = await prisma.analytics.findMany({
        where: {
            projects: { user_id: user.id }
        },
        include: { projects: true },
    });

    // 3. Serialize dates for client
    const serialized = analytics.map(a => ({
        ...a,
        created_at: a.created_at.toISOString(),
    }));

    // 4. Pass to Client Component
    return <AnalyticsContent initialData={serialized} />;
}
```

#### Step 4: Client Component (Interactivity)

```typescript
// src/app/(dashboard)/analytics/analytics-content.tsx

'use client';

import { useState } from 'react';
import type { Analytics } from '@/lib/types';

interface AnalyticsContentProps {
    initialData: Analytics[];
}

export function AnalyticsContent({ initialData }: AnalyticsContentProps) {
    const [analytics, setAnalytics] = useState(initialData);

    // Handle user interactions here

    return (
        <div>
            {/* UI rendering */}
        </div>
    );
}
```

#### Step 5: API Route (if mutations needed)

```typescript
// src/app/api/analytics/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const analytics = await prisma.analytics.create({
        data: {
            project_id: body.projectId,
            page_views: body.pageViews,
        },
    });

    return NextResponse.json(analytics);
}
```

### Feature Addition Checklist

- [ ] Database schema updated (`prisma/schema/schema.prisma`)
- [ ] Migration run (`npx prisma migrate dev`)
- [ ] TypeScript types added (`src/lib/types/index.ts`)
- [ ] Server Component created (data fetching)
- [ ] Client Component created (if interactive)
- [ ] API routes created (if mutations needed)
- [ ] Navigation updated (sidebar, links)
- [ ] Tests added (if applicable)

---

## Security Model

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LOGIN REQUEST                                                              │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │  Supabase Auth  │  ◄── Email/Password or OAuth                          │
│  │  (Client-side)  │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │  Session Cookie │  ◄── @supabase/ssr handles this                       │
│  │  (HTTP-only)    │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     EVERY PAGE REQUEST                               │   │
│  │                                                                      │   │
│  │  1. Middleware checks session cookie                                │   │
│  │  2. Server Component: supabase.auth.getUser()                       │   │
│  │  3. If no user → redirect to /login                                 │   │
│  │  4. If user → proceed with Prisma queries                           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Comparison: Prisma vs Supabase JS Client

| Aspect | Supabase JS (Before) | Prisma (Now) |
|--------|---------------------|--------------|
| **Credentials in browser** | Yes (`NEXT_PUBLIC_*`) | **No** (server only) |
| **Row Level Security needed** | Yes (must configure RLS) | **No** (server controls access) |
| **API exposure** | Public REST API | **No public endpoint** |
| **Attack surface** | Larger (exposed API) | **Smaller** (server-only) |
| **Query flexibility** | Limited by RLS | **Full SQL power** |

### Authorization Pattern

```typescript
// Authorization in Server Components
export default async function ProjectPage({ params }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Check project ownership/membership
    const project = await prisma.projects.findUnique({
        where: { id: params.id },
    });

    if (!project) notFound();

    // Check if user has access
    const isOwner = project.user_id === user.id;
    const isMember = await prisma.team_members.findFirst({
        where: { project_id: params.id, user_id: user.id },
    });

    if (!isOwner && !isMember) {
        redirect('/dashboard'); // No access
    }

    // User has access, continue...
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   profiles   │         │   projects   │         │    nodes     │        │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤        │
│  │ id (PK)      │◄───┐    │ id (PK)      │◄───┐    │ id (PK)      │        │
│  │ email        │    │    │ user_id (FK) │────┘    │ project_id   │────┐   │
│  │ full_name    │    │    │ name         │         │ title        │    │   │
│  │ avatar_url   │    │    │ description  │         │ slug         │    │   │
│  │ created_at   │    │    │ domain       │         │ node_type    │    │   │
│  │ updated_at   │    │    │ color        │         │ status       │    │   │
│  └──────────────┘    │    │ created_at   │         │ position_x   │    │   │
│                      │    │ updated_at   │         │ position_y   │    │   │
│                      │    └──────────────┘         └──────────────┘    │   │
│                      │           │                        │            │   │
│                      │           │                        │            │   │
│  ┌──────────────┐    │    ┌──────────────┐         ┌──────────────┐    │   │
│  │subscriptions │    │    │ team_members │         │   articles   │    │   │
│  ├──────────────┤    │    ├──────────────┤         ├──────────────┤    │   │
│  │ id (PK)      │    │    │ id (PK)      │         │ id (PK)      │    │   │
│  │ user_id (FK) │────┘    │ project_id   │─────────│ node_id (FK) │────┘   │
│  │ plan         │         │ user_id (FK) │────┐    │ project_id   │────────┤
│  │ status       │         │ role         │    │    │ content      │        │
│  │ stripe_*     │         │ created_at   │    │    │ word_count   │        │
│  │ current_*    │         └──────────────┘    │    │ seo_title    │        │
│  └──────────────┘                             │    └──────────────┘        │
│                                               │                            │
│                      ┌────────────────────────┘         ┌──────────────┐   │
│                      │                                  │    edges     │   │
│                      │    ┌──────────────┐              ├──────────────┤   │
│                      │    │ invitations  │              │ id (PK)      │   │
│                      │    ├──────────────┤              │ project_id   │───┤
│                      │    │ id (PK)      │              │ source_node  │   │
│                      │    │ project_id   │──────────────│ target_node  │   │
│                      │    │ email        │              │ edge_type    │   │
│                      └───►│ invited_by   │              │ label        │   │
│                           │ token        │              └──────────────┘   │
│                           │ role         │                                 │
│                           └──────────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | id, email, full_name |
| `projects` | User projects | id, user_id, name, domain |
| `nodes` | Content nodes on canvas | id, project_id, title, node_type, status |
| `edges` | Connections between nodes | id, source_node_id, target_node_id |
| `articles` | Article content | id, node_id, content, word_count |
| `subscriptions` | Stripe subscriptions | id, user_id, plan, status |
| `team_members` | Project collaborators | id, project_id, user_id, role |
| `invitations` | Pending team invites | id, project_id, email, token |

---

## Authentication Flow

### Server-Side Auth Check Pattern

```typescript
// Standard pattern for all protected pages

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedPage() {
    // 1. Create Supabase server client
    const supabase = await createClient();

    // 2. Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Redirect if not authenticated
    if (!user) {
        redirect('/login');
    }

    // 4. User is authenticated, proceed with page
    // Use user.id for Prisma queries
}
```

### Supabase Client Locations

| File | Purpose | When to Use |
|------|---------|-------------|
| `lib/supabase/server.ts` | Server-side auth | Server Components, API Routes |
| `lib/supabase/client.ts` | Client-side auth & mutations | Client Components |

---

## Environment Variables

### Required Variables

```bash
# ═══════════════════════════════════════════════════════════════
# SUPABASE - Authentication & Client Mutations
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ═══════════════════════════════════════════════════════════════
# PRISMA - Database Connection (Server-side only)
# ═══════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# ═══════════════════════════════════════════════════════════════
# STRIPE - Payments
# ═══════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ═══════════════════════════════════════════════════════════════
# EMAIL - Brevo (Transactional)
# ═══════════════════════════════════════════════════════════════
BREVO_API_KEY=xkeysib-...
EMAIL_FROM_NAME=SyncSEO
EMAIL_FROM_ADDRESS=your@email.com
BREVO_USER_LIST_ID=4
BREVO_NEWSLETTER_LIST_ID=5

# ═══════════════════════════════════════════════════════════════
# CAPTCHA - hCaptcha
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=...
HCAPTCHA_SECRET_KEY=...

# ═══════════════════════════════════════════════════════════════
# APP CONFIG
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=admin@email.com
SUPER_ADMIN_EMAILS=admin@email.com
```

### Variable Categories

| Prefix | Visibility | Purpose |
|--------|------------|---------|
| `NEXT_PUBLIC_*` | Browser + Server | Public config (URLs, keys) |
| No prefix | Server only | Secrets (API keys, DB credentials) |
| `DATABASE_URL` | Server only | Prisma connection |
| `DIRECT_URL` | Server only | Prisma migrations |

---

## Scalability

### Why This Architecture Scales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALABILITY BENEFITS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CLEAR PATTERN FOR NEW FEATURES                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Every feature follows: Server Component → Client Component               │
│  • Predictable code structure                                               │
│  • Easy onboarding for new developers                                       │
│                                                                             │
│  2. SEPARATION OF CONCERNS                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Data Layer: Prisma (type-safe, migrations, relations)                    │
│  • Auth Layer: Supabase Auth (battle-tested, secure)                        │
│  • UI Layer: React Server/Client Components                                 │
│  • API Layer: Next.js API routes                                            │
│                                                                             │
│  3. TYPE SAFETY                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Prisma generates types from database schema                              │
│  • TypeScript catches errors at compile time                                │
│  • Refactoring is safe and predictable                                      │
│                                                                             │
│  4. PERFORMANCE AT SCALE                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Server-side data fetching = faster initial load                          │
│  • Prisma connection pooling = handles concurrent users                     │
│  • Static marketing pages = CDN cached globally                             │
│  • Client mutations = responsive UI                                         │
│                                                                             │
│  5. EASY DATABASE CHANGES                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Schema changes in schema.prisma                                          │
│  • Run: npx prisma migrate dev                                              │
│  • Types auto-updated                                                       │
│  • No manual type maintenance                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Adding a New Feature: Example Workflow

```bash
# 1. Update database schema
# Edit prisma/schema/schema.prisma

# 2. Run migration
npx prisma migrate dev --name add_feature_x

# 3. Create Server Component
# /app/(dashboard)/feature-x/page.tsx

# 4. Create Client Component (if interactive)
# /app/(dashboard)/feature-x/feature-x-content.tsx

# 5. Add API routes (if needed)
# /app/api/feature-x/route.ts

# 6. Update navigation
# Add link to sidebar/nav

# 7. Test locally
npm run dev

# 8. Push to develop
git push origin develop
```

---

## Quick Reference

### Common Prisma Queries

```typescript
// Find many with conditions
const projects = await prisma.projects.findMany({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
});

// Find unique by ID
const project = await prisma.projects.findUnique({
    where: { id: projectId },
});

// Find first matching
const member = await prisma.team_members.findFirst({
    where: { project_id: projectId, user_id: userId },
});

// Count records
const count = await prisma.nodes.count({
    where: { project_id: projectId },
});

// Create record
const node = await prisma.nodes.create({
    data: { project_id, title, node_type: 'planned' },
});

// Update record
const updated = await prisma.projects.update({
    where: { id: projectId },
    data: { name: newName },
});

// Delete record
await prisma.projects.delete({
    where: { id: projectId },
});

// Include relations
const projectWithNodes = await prisma.projects.findUnique({
    where: { id: projectId },
    include: { nodes: true },
});
```

### File Naming Conventions

| Type | Naming | Example |
|------|--------|---------|
| Server Component (page) | `page.tsx` | `/projects/page.tsx` |
| Client Component | `*-content.tsx` | `projects-content.tsx` |
| API Route | `route.ts` | `/api/projects/route.ts` |
| UI Component | `kebab-case.tsx` | `project-card.tsx` |
| Utility | `kebab-case.ts` | `plan-limits.ts` |
| Types | `index.ts` in types folder | `lib/types/index.ts` |

---

## Troubleshooting

### Common Issues

1. **"Cannot find module '@/lib/prisma'"**
   - Run: `npx prisma generate`

2. **"Prisma client not initialized"**
   - Check DATABASE_URL is set correctly
   - Restart dev server

3. **"User is null in Server Component"**
   - Ensure `createClient()` is called with `await`
   - Check middleware is not blocking the request

4. **"Type error: Property X missing"**
   - Run: `npx prisma generate` to regenerate types
   - Check if schema.prisma was updated

5. **"Connection pool exhausted"**
   - Ensure using singleton pattern for Prisma client
   - Check `lib/prisma.ts` is properly configured

---

*This document should be updated when major architectural changes are made.*
