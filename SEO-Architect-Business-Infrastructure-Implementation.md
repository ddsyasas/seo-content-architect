# SEO Architect - Business Infrastructure Implementation Guide

## Document Overview

**Purpose:** This document provides implementation specifications for adding business infrastructure to SEO Architect, including subscription billing, usage limits, account management, and team collaboration features.

**Scope:** This document covers planning and specifications only. It does not include code implementations.

**Version:** 1.0  
**Last Updated:** January 2026

---

## Important: Project Naming

| Context | Name | Notes |
|---------|------|-------|
| **Current Codebase** | SEO Architect | This is the name used in the existing code, components, and database |
| **Future Brand Name** | SyncSEO.io | The product will be rebranded to this name for public launch |
| **Domain** | syncseo.io | Production domain (future) |

**For Implementation:** Continue using "SEO Architect" in all code, components, and UI until a separate rebranding task is undertaken. This document uses "SEO Architect" as the project name to maintain consistency with the existing codebase.

**Rebranding Scope (Future Task):**
- Update logo and brand assets
- Update site title and meta tags
- Update landing page copy
- Update email templates
- Update any hardcoded brand references

The rebranding is NOT part of this implementation and should be done as a separate task after business infrastructure is complete.

---

## Table of Contents

1. Implementation Overview
2. Pricing and Billing System
3. Usage Limits Enforcement
4. Account Settings Pages
5. Team Management System
6. Database Schema Additions
7. User Flows
8. UI Specifications
9. Implementation Phases
10. Testing Checklist

---

## 1. Implementation Overview

### 1.1 What We Are Building

| Feature Area | Description | Priority |
|--------------|-------------|----------|
| Pricing Page | Public page showing plan comparison | High |
| Stripe Billing | Payment processing, subscription management | High |
| Usage Limits | Enforce plan restrictions | High |
| Account Settings | User profile, subscription, billing management | High |
| Team Management | Per-project member invitations and roles | Medium |

### 1.2 What We Are NOT Building (Deferred)

| Feature | Reason | Future Phase |
|---------|--------|--------------|
| Admin Dashboard | Not needed until paying users exist | Phase E |
| Annual Pricing | Keep it simple at launch | Future |
| Free Trial | Using free tier as entry point instead | N/A |

### 1.3 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment Provider | Stripe | Industry standard, excellent documentation |
| Team Scope | Per-project invitations | More granular control, common SaaS pattern |
| Free Tier | Permanent free tier with limits | Lower barrier to entry, upgrade path clear |
| Trial Period | None | Free tier serves this purpose |

---

## 2. Pricing and Billing System

### 2.1 Pricing Structure

| Feature | Free | Pro ($19/month) | Agency ($49/month) |
|---------|------|-----------------|-------------------|
| Projects | 1 | 5 | Unlimited |
| Articles per Project | 10 | 100 | Unlimited |
| Canvas Nodes per Project | 20 | 200 | Unlimited |
| Team Members per Project | 1 (owner only) | 3 | 10 |
| SEO Score | Basic (score only) | Full (score + all indicators) | Full + history tracking |
| Export (PNG, CSV) | No | Yes | Yes |
| Integrations | No | Future: GSC, GA | Future: All + API access |
| Support | Community/Docs | Email support | Priority support |

### 2.2 Stripe Configuration

#### Products to Create in Stripe Dashboard

| Product Name | Price | Billing Cycle | Stripe Price ID (example) |
|--------------|-------|---------------|---------------------------|
| SEO Architect Pro | $19.00 | Monthly | price_pro_monthly |
| SEO Architect Agency | $49.00 | Monthly | price_agency_monthly |

#### Stripe Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription record, upgrade user plan |
| `customer.subscription.updated` | Update subscription status and plan |
| `customer.subscription.deleted` | Downgrade user to free plan |
| `invoice.payment_succeeded` | Update subscription period dates |
| `invoice.payment_failed` | Mark subscription as past_due, notify user |

### 2.3 New Pages Required

| Page URL | Purpose | Access |
|----------|---------|--------|
| `/pricing` | Public pricing comparison page | Public |
| `/checkout/[plan]` | Initiate Stripe checkout session | Authenticated |
| `/checkout/success` | Post-payment success confirmation | Authenticated |
| `/checkout/cancel` | Payment cancelled return page | Authenticated |
| `/settings/subscription` | View current plan, usage, upgrade options | Authenticated |
| `/settings/billing` | Payment method, invoices (via Stripe Portal) | Authenticated |

### 2.4 Pricing Page Specification

**URL:** `/pricing`

**Layout:**
- Header with navigation (same as main site)
- Hero section with headline
- Three-column plan comparison
- FAQ section
- Footer

**Plan Cards Should Display:**
- Plan name
- Price (with "/month" label)
- Feature list with checkmarks/x marks
- CTA button ("Start Free" / "Upgrade to Pro" / "Upgrade to Agency")
- "Most Popular" badge on Pro plan

**CTA Button Behavior:**

| User State | Free Button | Pro Button | Agency Button |
|------------|-------------|------------|---------------|
| Not logged in | Go to signup | Go to signup | Go to signup |
| Logged in, Free plan | Disabled/Current | Go to checkout | Go to checkout |
| Logged in, Pro plan | Show downgrade info | Disabled/Current | Go to checkout |
| Logged in, Agency plan | Show downgrade info | Show downgrade info | Disabled/Current |

### 2.5 Checkout Flow

**Step-by-Step Process:**

1. User clicks "Upgrade to Pro" on pricing page or upgrade prompt
2. System checks if user is authenticated (redirect to login if not)
3. System creates Stripe Checkout Session with:
   - Customer email (from user profile)
   - Price ID for selected plan
   - Success URL: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `/checkout/cancel`
4. User redirected to Stripe hosted checkout page
5. User completes payment on Stripe
6. Stripe redirects to success URL
7. Webhook receives `checkout.session.completed` event
8. System creates subscription record and updates user plan
9. Success page confirms upgrade and redirects to dashboard

### 2.6 Stripe Customer Portal

Instead of building custom billing management, use Stripe's hosted Customer Portal for:
- Viewing invoices
- Updating payment method
- Cancelling subscription

**Implementation:**
- Create a portal session via Stripe API
- Redirect user to the portal URL
- User returns to `/settings/billing` after portal actions

---

## 3. Usage Limits Enforcement

### 3.1 Limit Definitions

| Resource | How to Count | Free Limit | Pro Limit | Agency Limit |
|----------|--------------|------------|-----------|--------------|
| Projects | Count rows in `projects` table where `user_id` = current user | 1 | 5 | Unlimited (999999) |
| Articles | Count rows in `nodes` table where `project_id` = current project AND `node_type` != 'external' | 10 | 100 | Unlimited |
| Canvas Nodes | Count rows in `nodes` table where `project_id` = current project | 20 | 200 | Unlimited |
| Team Members | Count rows in `team_members` table where `project_id` = current project AND `status` = 'active' | 1 | 3 | 10 |

### 3.2 Where to Enforce Limits

| User Action | Check Required | If Limit Exceeded |
|-------------|----------------|-------------------|
| Create new project | Count user's projects | Block creation, show upgrade modal |
| Create new article | Count project's articles | Block creation, show upgrade modal |
| Add node on canvas | Count project's nodes | Block addition, show upgrade modal |
| Invite team member | Count project's active members | Block invite, show upgrade modal |

### 3.3 Enforcement Strategy

**API Level (Required):**
- Every create/add endpoint must check limits before allowing action
- Return specific error code (e.g., 403 with `reason: 'limit_exceeded'`)
- Include current usage and limit in error response

**UI Level (User Experience):**
- Check limits before showing create buttons as enabled
- Show usage indicators in relevant areas
- Pre-emptively show upgrade prompts when near limit (e.g., 80%)

### 3.4 Usage Indicators

**Where to Show Usage:**

| Location | What to Show |
|----------|--------------|
| Projects page header | "3 of 5 projects" (for Pro users) |
| Project articles tab | "8 of 100 articles" |
| Canvas toolbar | "15 of 200 nodes" |
| Team settings | "2 of 3 team members" |
| Settings/Subscription page | All usage metrics in one view |

**Visual Format:**
```
[Progress Bar] 3/5 Projects used
```

**Color Coding:**

| Usage Percentage | Color | Meaning |
|------------------|-------|---------|
| 0-60% | Green | Plenty of room |
| 61-80% | Yellow | Getting close |
| 81-99% | Orange | Almost at limit |
| 100% | Red | At limit |

### 3.5 Upgrade Modal Specification

**Trigger:** User attempts action that exceeds their plan limit

**Modal Content:**
- Headline: "Upgrade to unlock more"
- Current limit message: "You've reached the limit of X [resource] on the Free plan."
- Upgrade benefits: Brief list of what Pro/Agency offers
- CTA buttons: "Upgrade to Pro" / "Upgrade to Agency"
- Dismiss option: "Maybe later" link

**Behavior:**
- Modal is dismissible (user can close without upgrading)
- Action remains blocked until upgrade or existing resource deleted

---

## 4. Account Settings Pages

### 4.1 Settings Page Structure

**URL Structure:**

| URL | Page | Description |
|-----|------|-------------|
| `/settings` | Redirect | Redirects to `/settings/profile` |
| `/settings/profile` | Profile | Edit name, email, password |
| `/settings/subscription` | Subscription | View plan, usage, upgrade |
| `/settings/billing` | Billing | Payment method, invoices (Stripe Portal) |
| `/settings/preferences` | Preferences | App preferences, notifications |

### 4.2 Settings Layout

**Structure:**
- Left sidebar: Settings navigation menu
- Right content area: Current settings section

**Navigation Menu Items:**
1. Profile
2. Subscription
3. Billing
4. Preferences

### 4.3 Profile Settings Page

**URL:** `/settings/profile`

**Sections:**

**Personal Information**
| Field | Type | Validation |
|-------|------|------------|
| Full Name | Text input | Required, 2-100 characters |
| Email | Email input | Required, valid email, unique check |
| Avatar | Image upload | Optional, max 2MB, JPG/PNG |

**Change Password**
| Field | Type | Validation |
|-------|------|------------|
| Current Password | Password input | Required |
| New Password | Password input | Required, min 8 characters |
| Confirm New Password | Password input | Must match new password |

**Danger Zone**
- Delete Account button
- Requires confirmation modal
- Warns about data loss
- Requires password entry to confirm

### 4.4 Subscription Settings Page

**URL:** `/settings/subscription`

**Sections:**

**Current Plan**
| Display Element | Description |
|-----------------|-------------|
| Plan name | "Free Plan" / "Pro Plan" / "Agency Plan" |
| Plan badge | Visual indicator with plan color |
| Price | "$0/month" / "$19/month" / "$49/month" |
| Status | Active / Past Due / Cancelled |
| Renewal date | "Renews on Feb 15, 2026" (for paid plans) |

**Usage Overview**
| Metric | Display |
|--------|---------|
| Projects | Progress bar + "3 of 5 used" |
| Articles (total across projects) | Progress bar + count |
| Team members (total across projects) | Progress bar + count |

**Plan Actions**

| Current Plan | Available Actions |
|--------------|-------------------|
| Free | "Upgrade to Pro" button, "Upgrade to Agency" button |
| Pro | "Upgrade to Agency" button, "Downgrade to Free" link |
| Agency | "Downgrade to Pro" link, "Downgrade to Free" link |

**Downgrade Behavior:**
- Show warning about what will happen (features lost, limit enforcement)
- If over new plan limits, require user to delete resources first
- Downgrade takes effect at end of current billing period

### 4.5 Billing Settings Page

**URL:** `/settings/billing`

**For Free Users:**
- Message: "You're on the Free plan. Upgrade to access billing features."
- "View Plans" button linking to `/pricing`

**For Paid Users:**

**Payment Method Section**
| Element | Description |
|---------|-------------|
| Card display | "Visa ending in 4242" |
| Expiry | "Expires 12/2027" |
| Update button | Opens Stripe Customer Portal |

**Billing History Section**
| Column | Description |
|--------|-------------|
| Date | Invoice date |
| Description | "Pro Plan - Monthly" |
| Amount | "$19.00" |
| Status | Paid / Failed |
| Action | "View Invoice" link (opens Stripe receipt) |

**Manage Billing Button**
- Opens Stripe Customer Portal
- User can update card, view all invoices, cancel subscription

### 4.6 Preferences Settings Page

**URL:** `/settings/preferences`

**Email Notifications**
| Setting | Type | Default |
|---------|------|---------|
| Weekly usage summary | Toggle | On |
| Team invitation notifications | Toggle | On |
| Product updates and tips | Toggle | On |

**Editor Preferences**
| Setting | Type | Default |
|---------|------|---------|
| Auto-save interval | Dropdown (30s, 1m, 2m, 5m) | 1m |
| Default content type for new articles | Dropdown (Pillar, Cluster, Supporting, Planned) | Cluster |

**Canvas Preferences**
| Setting | Type | Default |
|---------|------|---------|
| Snap to grid | Toggle | Off |
| Show minimap | Toggle | On |
| Default zoom level | Dropdown (50%, 75%, 100%, 125%, 150%) | 100% |

---

## 5. Team Management System

### 5.1 Team Structure

**Scope:** Teams are per-project, not account-wide. Each project has its own team.

**Roles:**

| Role | Description | Permissions |
|------|-------------|-------------|
| Owner | Project creator, has full control | All permissions, cannot be removed |
| Admin | Can manage project and team | Edit project settings, invite/remove members, edit all content |
| Editor | Can create and edit content | Create/edit articles, edit canvas, cannot manage team |
| Viewer | Read-only access | View articles and canvas only |

### 5.2 Role Permissions Matrix

| Permission | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| View project | Yes | Yes | Yes | Yes |
| View articles | Yes | Yes | Yes | Yes |
| View canvas | Yes | Yes | Yes | Yes |
| Create articles | Yes | Yes | Yes | No |
| Edit articles | Yes | Yes | Yes | No |
| Delete articles | Yes | Yes | No | No |
| Edit canvas (add/move nodes) | Yes | Yes | Yes | No |
| Delete nodes | Yes | Yes | No | No |
| Edit project settings | Yes | Yes | No | No |
| Invite team members | Yes | Yes | No | No |
| Remove team members | Yes | Yes (except owner) | No | No |
| Change member roles | Yes | Yes (cannot change owner) | No | No |
| Delete project | Yes | No | No | No |
| Transfer ownership | Yes | No | No | No |

### 5.3 Team Limits by Plan

| Plan | Max Team Members per Project |
|------|------------------------------|
| Free | 1 (owner only, no invites) |
| Pro | 3 |
| Agency | 10 |

### 5.4 Team Management UI Location

**Access Point:** Project Settings

**Navigation:**
1. User opens a project
2. Clicks project settings icon (gear icon) or "Settings" in project menu
3. Sees "Team" tab/section in project settings

### 5.5 Team Settings Page Specification

**URL:** `/project/[project-id]/settings/team`

**Sections:**

**Team Members List**

| Column | Description |
|--------|-------------|
| Member | Avatar + Name + Email |
| Role | Badge showing role (Owner/Admin/Editor/Viewer) |
| Joined | Date they accepted invitation |
| Actions | Change role dropdown, Remove button |

**Owner Row:**
- Cannot be removed
- Cannot change role (always shows "Owner")
- Shows "Transfer Ownership" option in actions

**Pending Invitations List**

| Column | Description |
|--------|-------------|
| Email | Invited email address |
| Role | Role they will have when accepted |
| Invited | Date invitation sent |
| Expires | Expiration date (7 days from sent) |
| Actions | Resend, Cancel buttons |

**Invite Button:**
- Located at top right of team section
- Opens invite modal
- Disabled if at team member limit (with upgrade prompt)

### 5.6 Invite Modal Specification

**Trigger:** Click "Invite Member" button

**Fields:**

| Field | Type | Validation |
|-------|------|------------|
| Email Address | Email input | Required, valid email format |
| Role | Dropdown | Required, options: Admin, Editor, Viewer |

**Behavior:**
- Cannot invite existing team members
- Cannot invite if at plan limit
- Sends invitation email with unique link
- Creates pending invitation record
- Shows success message with option to invite another

**Invitation Email Content:**
- From: SEO Architect (noreply@[yourdomain])
- Subject: "You've been invited to join [Project Name] on SEO Architect"
- Body: Inviter name, project name, role, accept button/link
- Link expires in 7 days

### 5.7 Accept Invitation Flow

**URL:** `/invite/[token]`

**Scenarios:**

**Scenario A: User is not logged in**
1. Show invitation details (project name, inviter, role)
2. Two options: "Sign Up to Join" / "Log In to Join"
3. After signup/login, automatically accept invitation
4. Redirect to project

**Scenario B: User is logged in, invitation is for their email**
1. Show invitation details
2. "Accept Invitation" button
3. On accept, add to team, redirect to project

**Scenario C: User is logged in, invitation is for different email**
1. Show message: "This invitation was sent to [email]. You're logged in as [different email]."
2. Options: "Log out and use different account" / "Decline"

**Scenario D: Invitation expired or invalid**
1. Show error message: "This invitation has expired or is invalid."
2. "Go to Dashboard" button

### 5.8 Removing Team Members

**Who Can Remove:**
- Owner can remove anyone except themselves
- Admin can remove Editors and Viewers only
- Editors and Viewers cannot remove anyone

**Removal Process:**
1. Click "Remove" button on member row
2. Confirmation modal: "Remove [Name] from [Project]?"
3. On confirm, member loses access immediately
4. Removed member sees project removed from their dashboard

### 5.9 Changing Roles

**Who Can Change Roles:**
- Owner can change anyone's role (except their own)
- Admin can change Editor/Viewer roles only

**Process:**
1. Click role dropdown on member row
2. Select new role
3. Immediate update, no confirmation needed
4. Member's permissions change immediately

### 5.10 Transfer Ownership

**Who Can Transfer:** Only current owner

**Process:**
1. Owner clicks "Transfer Ownership" on another member's row
2. Confirmation modal with strong warning
3. Must type project name to confirm
4. On confirm:
   - Selected member becomes Owner
   - Previous owner becomes Admin
   - Immediate effect

---

## 6. Database Schema Additions

### 6.1 New Tables

#### Table: subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | Primary Key, Default: gen_random_uuid() | Unique identifier |
| user_id | UUID | Foreign Key -> profiles.id, Unique | One subscription per user |
| stripe_customer_id | TEXT | Not Null | Stripe customer ID |
| stripe_subscription_id | TEXT | Nullable | Stripe subscription ID (null for free) |
| plan | TEXT | Not Null, Default: 'free' | Plan name: free, pro, agency |
| status | TEXT | Not Null, Default: 'active' | active, past_due, cancelled |
| current_period_start | TIMESTAMPTZ | Nullable | Billing period start |
| current_period_end | TIMESTAMPTZ | Nullable | Billing period end |
| cancel_at_period_end | BOOLEAN | Default: false | Pending cancellation flag |
| created_at | TIMESTAMPTZ | Default: now() | Record creation time |
| updated_at | TIMESTAMPTZ | Default: now() | Last update time |

#### Table: team_members

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | Primary Key, Default: gen_random_uuid() | Unique identifier |
| project_id | UUID | Foreign Key -> projects.id, On Delete Cascade | Project this membership belongs to |
| user_id | UUID | Foreign Key -> profiles.id, On Delete Cascade | User who is a member |
| role | TEXT | Not Null | owner, admin, editor, viewer |
| invited_by | UUID | Foreign Key -> profiles.id, Nullable | Who sent the invitation |
| joined_at | TIMESTAMPTZ | Default: now() | When user joined/accepted |
| created_at | TIMESTAMPTZ | Default: now() | Record creation time |

**Unique Constraint:** (project_id, user_id) - A user can only be a member once per project

#### Table: team_invitations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | Primary Key, Default: gen_random_uuid() | Unique identifier |
| project_id | UUID | Foreign Key -> projects.id, On Delete Cascade | Project invitation is for |
| email | TEXT | Not Null | Email address invited |
| role | TEXT | Not Null | Role when accepted: admin, editor, viewer |
| invited_by | UUID | Foreign Key -> profiles.id | Who sent the invitation |
| token | TEXT | Not Null, Unique | Unique invitation token for URL |
| expires_at | TIMESTAMPTZ | Not Null | When invitation expires |
| accepted_at | TIMESTAMPTZ | Nullable | When invitation was accepted (null if pending) |
| created_at | TIMESTAMPTZ | Default: now() | Record creation time |

### 6.2 Modified Tables

#### Table: profiles (additions)

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| stripe_customer_id | TEXT | Nullable, Unique | Stripe customer ID |

### 6.3 Row Level Security Policies

#### subscriptions table

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view own subscription | SELECT | auth.uid() = user_id |
| Users can update own subscription | UPDATE | auth.uid() = user_id |
| Service role can manage all | ALL | Service role only (for webhooks) |

#### team_members table

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can view project team | SELECT | user is a member of the project |
| Owners and admins can insert | INSERT | user is owner or admin of project |
| Owners and admins can update | UPDATE | user is owner or admin of project |
| Owners and admins can delete | DELETE | user is owner or admin of project, cannot delete owner |

#### team_invitations table

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Owners and admins can view | SELECT | user is owner or admin of project |
| Owners and admins can insert | INSERT | user is owner or admin of project |
| Owners and admins can delete | DELETE | user is owner or admin of project |
| Anyone can view by token | SELECT | For accept invitation flow |

### 6.4 Indexes

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| subscriptions | idx_subscriptions_user_id | user_id | Fast lookup by user |
| subscriptions | idx_subscriptions_stripe_customer | stripe_customer_id | Webhook lookups |
| team_members | idx_team_members_project | project_id | List project members |
| team_members | idx_team_members_user | user_id | List user's projects |
| team_invitations | idx_invitations_token | token | Accept invitation lookup |
| team_invitations | idx_invitations_project | project_id | List project invitations |

### 6.5 Database Functions/Triggers

#### Auto-create subscription on user signup

- When new user created in profiles
- Create corresponding subscription record with plan = 'free'

#### Auto-add owner to team_members on project creation

- When new project created
- Add creator as team member with role = 'owner'

#### Update updated_at timestamp

- Apply to subscriptions table
- Trigger on UPDATE to set updated_at = now()

---

## 7. User Flows

### 7.1 New User Signup to Paid Conversion

```
1. User visits the landing page
2. Clicks "Start Free"
3. Creates account (signup page)
4. Redirected to dashboard
5. Creates first project
6. Uses product, hits limit
7. Sees upgrade modal
8. Clicks "Upgrade to Pro"
9. Redirected to Stripe Checkout
10. Completes payment
11. Redirected to success page
12. Now has Pro plan, limits increased
```

### 7.2 Existing User Upgrade

```
1. User logged into dashboard
2. Navigates to Settings > Subscription
3. Clicks "Upgrade to Pro"
4. Redirected to Stripe Checkout
5. Completes payment
6. Redirected to success page
7. Subscription page shows new plan
```

### 7.3 User Downgrade

```
1. User on Pro plan navigates to Settings > Subscription
2. Clicks "Downgrade to Free"
3. Warning modal shows:
   - Features they will lose
   - Date downgrade takes effect (end of billing period)
   - If over free limits, must delete resources first
4. User confirms downgrade
5. System marks subscription for cancellation at period end
6. User continues with Pro until period ends
7. At period end, Stripe sends webhook
8. System updates plan to free
```

### 7.4 Team Invitation Flow

```
Owner/Admin side:
1. Opens project settings > Team
2. Clicks "Invite Member"
3. Enters email, selects role
4. Clicks "Send Invitation"
5. System creates invitation record
6. Email sent to invitee
7. Invitation appears in "Pending" list

Invitee side:
1. Receives email with invitation
2. Clicks "Accept Invitation" link
3. If not logged in, signs up or logs in
4. Sees invitation details
5. Clicks "Accept"
6. Added to project team
7. Redirected to project
8. Project now appears in their dashboard
```

### 7.5 Remove Team Member Flow

```
1. Owner/Admin opens project settings > Team
2. Finds member to remove
3. Clicks "Remove" button
4. Confirmation modal appears
5. Clicks "Remove" to confirm
6. Member immediately removed
7. Removed member's access revoked
8. Project disappears from their dashboard
```

---

## 8. UI Specifications

### 8.1 Pricing Page Layout

**Header Section:**
- Navigation bar (same as main site)
- Headline: "Simple, transparent pricing"
- Subheadline: "Start free, upgrade when you need more"

**Plan Cards Section:**
- Three cards side by side (responsive: stacked on mobile)
- Equal height cards
- "Most Popular" badge on Pro card

**Plan Card Structure:**
```
┌─────────────────────────────────┐
│ [Most Popular badge - Pro only] │
│                                 │
│        Plan Name                │
│        $XX/month                │
│                                 │
│   ───────────────────────────   │
│                                 │
│   ✓ Feature 1                   │
│   ✓ Feature 2                   │
│   ✓ Feature 3                   │
│   ✗ Feature 4 (greyed out)      │
│   ...                           │
│                                 │
│   ┌─────────────────────────┐   │
│   │    CTA Button           │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

**FAQ Section:**
- Accordion-style FAQ items
- Questions to include:
  - "Can I change plans later?"
  - "What happens if I exceed my limits?"
  - "How does team billing work?"
  - "Can I cancel anytime?"
  - "Do you offer refunds?"

### 8.2 Settings Page Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  Settings                                               │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│  ○ Profile     │     [Content Area]                     │
│  ○ Subscription│                                        │
│  ○ Billing     │     Shows selected section             │
│  ○ Preferences │                                        │
│                │                                        │
│                │                                        │
│                │                                        │
│                │                                        │
└────────────────┴────────────────────────────────────────┘
```

### 8.3 Team Settings Layout

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  Team                                      [Invite +]   │
│                                                         │
│  Team Members (3 of 5)                                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 👤 John Smith          Owner        Joined Jan 1   ││
│  │    john@example.com                                 ││
│  ├─────────────────────────────────────────────────────┤│
│  │ 👤 Jane Doe            Admin ▼      Joined Jan 5   ││
│  │    jane@example.com                        [Remove] ││
│  ├─────────────────────────────────────────────────────┤│
│  │ 👤 Bob Wilson          Editor ▼     Joined Jan 10  ││
│  │    bob@example.com                         [Remove] ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Pending Invitations (1)                                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 📧 alice@example.com   Viewer   Expires Jan 20     ││
│  │                                [Resend] [Cancel]    ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 8.4 Upgrade Modal

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│                                                    [×]  │
│                                                         │
│        🚀 Upgrade to unlock more                        │
│                                                         │
│   You've reached the limit of 1 project on the          │
│   Free plan.                                            │
│                                                         │
│   Upgrade to Pro to get:                                │
│   ✓ Up to 5 projects                                    │
│   ✓ 100 articles per project                            │
│   ✓ Full SEO score indicators                           │
│   ✓ Export to PNG and CSV                               │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │         Upgrade to Pro - $19/month              │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │        Upgrade to Agency - $49/month            │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│                    Maybe later                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.5 Usage Indicator Component

**Inline Version (for headers):**
```
Projects: ████████░░ 4/5
```

**Card Version (for settings page):**
```
┌─────────────────────────────────┐
│ Projects                        │
│ ████████████████░░░░  4 of 5    │
│                                 │
│ [Upgrade for unlimited →]       │
└─────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase A: Stripe Integration and Billing (Priority: High)

**Duration:** 1-2 weeks

**Tasks:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| A1 | Create Stripe account and configure products | None |
| A2 | Add Stripe environment variables | A1 |
| A3 | Create subscriptions database table | None |
| A4 | Create Stripe webhook endpoint | A2, A3 |
| A5 | Build pricing page UI | None |
| A6 | Implement checkout flow (create session, redirect) | A2 |
| A7 | Build checkout success page | A6 |
| A8 | Build checkout cancel page | A6 |
| A9 | Handle webhook events (update subscription) | A4 |
| A10 | Test complete payment flow | A1-A9 |

**Deliverables:**
- Working Stripe integration
- Public pricing page
- Users can upgrade to Pro/Agency
- Subscriptions tracked in database

### Phase B: Usage Limits (Priority: High)

**Duration:** 1 week

**Tasks:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| B1 | Create limit configuration constants | Phase A |
| B2 | Build limit checking utility functions | B1 |
| B3 | Add limit checks to project creation API | B2 |
| B4 | Add limit checks to article creation API | B2 |
| B5 | Add limit checks to node creation API | B2 |
| B6 | Build upgrade modal component | None |
| B7 | Integrate upgrade modal triggers | B3-B6 |
| B8 | Add usage indicators to UI | B2 |
| B9 | Test limit enforcement | B1-B8 |

**Deliverables:**
- Limits enforced for all resources
- Upgrade modals appear when limits hit
- Usage indicators visible in UI

### Phase C: Account Settings (Priority: High)

**Duration:** 1 week

**Tasks:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| C1 | Create settings page layout with navigation | None |
| C2 | Build profile settings section | C1 |
| C3 | Build subscription settings section | C1, Phase A |
| C4 | Implement Stripe Customer Portal redirect | Phase A |
| C5 | Build billing settings section | C4 |
| C6 | Build preferences settings section | C1 |
| C7 | Implement downgrade flow | C3 |
| C8 | Test all settings functionality | C1-C7 |

**Deliverables:**
- Complete settings area
- Users can manage profile
- Users can view/manage subscription
- Users can access billing via Stripe Portal

### Phase D: Team Management (Priority: Medium)

**Duration:** 2 weeks

**Tasks:**

| Task | Description | Dependencies |
|------|-------------|--------------|
| D1 | Create team_members database table | None |
| D2 | Create team_invitations database table | None |
| D3 | Set up RLS policies for team tables | D1, D2 |
| D4 | Auto-add owner on project creation | D1 |
| D5 | Build team settings UI in project | D1 |
| D6 | Build invite modal | D5 |
| D7 | Create invitation email template | None |
| D8 | Implement send invitation API | D2, D7 |
| D9 | Build accept invitation page | D2 |
| D10 | Implement accept invitation API | D9 |
| D11 | Implement remove member functionality | D5 |
| D12 | Implement change role functionality | D5 |
| D13 | Add team limit checks | D1, Phase B |
| D14 | Update all APIs for role-based permissions | D1, D3 |
| D15 | Test complete team flows | D1-D14 |

**Deliverables:**
- Full team management system
- Invitation flow working
- Role permissions enforced
- Team limits by plan

---

## 10. Testing Checklist

### 10.1 Billing Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Free user upgrades to Pro | Click upgrade, complete Stripe checkout | Plan shows Pro, limits increased |
| Pro user upgrades to Agency | Click upgrade, complete checkout | Plan shows Agency |
| Pro user downgrades to Free | Click downgrade, confirm | Shows pending cancellation, downgrades at period end |
| Payment fails | Use Stripe test card for failure | Subscription marked past_due, user notified |
| User cancels in Stripe Portal | Cancel via portal | Webhook updates subscription |
| Webhook handles checkout.session.completed | Trigger webhook | Subscription created/updated |
| Webhook handles invoice.payment_failed | Trigger webhook | Status updated to past_due |

### 10.2 Usage Limit Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Free user creates 2nd project | Create project at limit | Blocked, upgrade modal shown |
| Free user adds 11th article | Add article at limit | Blocked, upgrade modal shown |
| Free user adds 21st node | Add node at limit | Blocked, upgrade modal shown |
| Pro user creates 6th project | Create project at limit | Blocked, upgrade modal shown |
| Usage indicator accuracy | Check counts vs actual | Numbers match |
| Upgrade unlocks limits | Upgrade to Pro, retry blocked action | Action now succeeds |

### 10.3 Account Settings Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Update profile name | Change name, save | Name updated |
| Update email | Change email, save | Email updated (may require verification) |
| Change password | Enter current, new password | Password changed |
| View subscription status | Navigate to subscription page | Correct plan shown |
| View usage metrics | Check subscription page | Accurate usage displayed |
| Access Stripe Portal | Click manage billing | Redirects to Stripe |

### 10.4 Team Management Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Owner invites member | Send invitation | Email sent, pending shown |
| Invitee accepts invitation | Click link, accept | Added to team, can access project |
| Admin invites member | Send invitation as admin | Works same as owner |
| Editor cannot invite | Try to invite as editor | No invite button visible |
| Remove team member | Owner removes editor | Member loses access |
| Change member role | Change editor to admin | Permissions updated |
| Transfer ownership | Transfer to admin | Roles swapped |
| Expired invitation | Try to accept after 7 days | Error shown |
| Team limit reached | Try to invite at limit | Blocked, upgrade modal |
| Viewer permissions | Log in as viewer, try to edit | Edit actions disabled |

---

## Appendix A: Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| STRIPE_SECRET_KEY | Stripe API secret key | sk_live_... |
| STRIPE_PUBLISHABLE_KEY | Stripe publishable key | pk_live_... |
| STRIPE_WEBHOOK_SECRET | Webhook endpoint secret | whsec_... |
| STRIPE_PRO_PRICE_ID | Price ID for Pro plan | price_... |
| STRIPE_AGENCY_PRICE_ID | Price ID for Agency plan | price_... |
| NEXT_PUBLIC_APP_URL | Application base URL | https://your-domain.com |

---

## Appendix B: Email Templates Needed

| Template | Trigger | Content |
|----------|---------|---------|
| Team Invitation | User invited to project | Inviter name, project name, role, accept link |
| Invitation Accepted | Invitee accepts | Notify inviter that user joined |
| Member Removed | User removed from team | Notify removed user |
| Payment Failed | Stripe payment fails | Warning, update payment link |
| Subscription Cancelled | User cancels subscription | Confirmation, offboarding |
| Welcome to Pro | User upgrades to Pro | Thank you, feature highlights |
| Welcome to Agency | User upgrades to Agency | Thank you, feature highlights |

---

## Appendix C: API Endpoints Needed

### Billing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/billing/create-checkout-session | Create Stripe checkout session |
| POST | /api/billing/create-portal-session | Create Stripe customer portal session |
| POST | /api/webhooks/stripe | Handle Stripe webhook events |
| GET | /api/billing/subscription | Get current user's subscription |

### Team Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/[id]/team | List project team members |
| POST | /api/projects/[id]/team/invite | Send team invitation |
| DELETE | /api/projects/[id]/team/[memberId] | Remove team member |
| PATCH | /api/projects/[id]/team/[memberId] | Update member role |
| POST | /api/invitations/[token]/accept | Accept team invitation |
| GET | /api/invitations/[token] | Get invitation details |
| DELETE | /api/invitations/[id] | Cancel pending invitation |

---

## Document End

**Next Steps:**
1. Review this specification with development team
2. Set up Stripe account and get API keys
3. Begin Phase A implementation
4. Test thoroughly in Stripe test mode before going live

**Questions or Clarifications:**
Contact the product owner for any specification questions before implementation.
