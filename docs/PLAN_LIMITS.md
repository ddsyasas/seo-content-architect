# Plan Limits System Documentation

This document explains how plan limits work in SyncSEO, where they're configured, how they're enforced, and how to safely modify them.

---

## Table of Contents

1. [Overview](#overview)
2. [Plan Configuration](#plan-configuration)
3. [Limit Enforcement Points](#limit-enforcement-points)
4. [Feature Restrictions](#feature-restrictions)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [How Limits Work for Users](#how-limits-work-for-users)
8. [How to Modify Limits](#how-to-modify-limits)
9. [Testing Limits](#testing-limits)
10. [Important Notes & Edge Cases](#important-notes--edge-cases)

---

## Overview

SyncSEO has three subscription tiers with different resource limits and feature restrictions:

### Resource Limits (Numeric)

| Resource | Free | Pro ($7/mo) | Agency ($49/mo) |
|----------|------|--------------|-----------------|
| Projects | 1 | 5 | Unlimited (999,999) |
| Nodes per project | 20 | 200 | Unlimited (999,999) |
| Articles per project | 10 | 100 | Unlimited (999,999) |
| Team members per project | 1 | 3 | 10 |

### Feature Restrictions (Boolean)

| Feature | Free | Pro | Agency |
|---------|------|-----|--------|
| Public Article Sharing | ❌ No | ✅ Yes | ✅ Yes |
| Export (PNG, CSV) | ❌ No | ✅ Yes | ✅ Yes |
| Integrations | ❌ No | ❌ No | ✅ Yes |

### Key Concepts

- **Project Owner**: The user who created the project. Their subscription determines the limits AND features.
- **Team Members**: Users invited to a project. They inherit the project owner's limits and features.
- **Limit Check**: A server-side validation before creating resources (numeric limits).
- **Feature Check**: A server-side validation before using gated features (boolean features).
- **Graceful Degradation**: When limits are reached or features unavailable, operations fail gracefully with user-friendly messages and upgrade prompts.

---

## Plan Configuration

### Location
```
/src/lib/stripe/config.ts
```

### Structure
```typescript
export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        stripePriceId: null,
        limits: {
            projects: 1,
            articlesPerProject: 10,
            nodesPerProject: 20,
            teamMembersPerProject: 1,
        },
        features: {
            seoScore: 'basic',
            export: false,
            integrations: false,
            support: 'community',
            publicSharing: false,  // Cannot share articles publicly
        },
    },
    pro: {
        name: 'Pro',
        price: 7,  // Promotional price
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        limits: {
            projects: 5,
            articlesPerProject: 100,
            nodesPerProject: 200,
            teamMembersPerProject: 3,
        },
        features: {
            seoScore: 'full',
            export: true,
            integrations: false,
            support: 'email',
            publicSharing: true,   // Can share articles via public links
        },
    },
    agency: {
        name: 'Agency',
        price: 49,
        stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
        limits: {
            projects: 999999,  // Effectively unlimited
            articlesPerProject: 999999,
            nodesPerProject: 999999,
            teamMembersPerProject: 10,
        },
        features: {
            seoScore: 'full',
            export: true,
            integrations: true,
            support: 'priority',
            publicSharing: true,   // Can share articles via public links
        },
    },
} as const;
```

### Helper Functions
```typescript
getPlanConfig(plan: string)    // Get full plan configuration
getPlanLimits(plan: string)    // Get just the limits object
planHasFeature(plan, feature)  // Check if plan has a feature
```

---

## Limit Enforcement Points

Limits are enforced at **5 locations** in the codebase:

### 1. Project Creation
**File:** `/src/app/(dashboard)/projects/page.tsx`
**Function:** `handleCreateProject()`
**What it checks:** User's total owned projects vs plan limit

```typescript
const limitCheck = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'project' })
}).then(r => r.json());

if (!limitCheck.allowed) {
    throw new Error(limitCheck.message);
}
```

**UI Behavior:**
- Button disabled when at limit
- Shows "Upgrade to Create More" button
- Amber warning banner when limit reached

---

### 2. Node Creation (Canvas)
**File:** `/src/components/canvas/canvas-editor.tsx`
**Function:** `handleAddNode()`
**What it checks:** Project's total nodes vs owner's plan limit

```typescript
const limitCheck = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'node', projectId })
}).then(r => r.json());

if (!limitCheck.allowed) {
    setLimitError(limitCheck.message);
    return;
}
```

**UI Behavior:**
- Amber banner appears at top of canvas
- Auto-hides after 5 seconds
- Can be manually dismissed

---

### 3. Article Creation
**File:** `/src/components/editor/new-article-page.tsx`
**Function:** `handleCreate()`
**What it checks:** Project's total articles vs owner's plan limit

```typescript
const limitCheck = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'article', projectId })
}).then(r => r.json());

if (!limitCheck.allowed) {
    setError(limitCheck.message);
    return;
}
```

**UI Behavior:**
- Error message displayed in form
- Create button stays enabled but submission fails

---

### 4. External Node Creation (From Article Links)
**File:** `/src/components/editor/article-editor.tsx`
**Function:** `saveData()` (inside outbound links processing)
**What it checks:** Project's total nodes when creating external nodes from links

```typescript
let nodeLimit = { allowed: true, current: 0, limit: 999999 };
const limitRes = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'node', projectId })
});
nodeLimit = await limitRes.json();

// Inside the loop for each external link:
if (!nodeLimit.allowed || (nodeLimit.current + nodesCreatedInThisSave) >= nodeLimit.limit) {
    setNodeLimitWarning(`Node limit reached...`);
    continue; // Skip creating this node, but preserve the link in content
}
```

**UI Behavior:**
- Amber warning banner below article header
- Links preserved in article (nodes created when user upgrades)
- Can be dismissed

---

### 5. Team Member Invitation
**File:** `/src/app/api/projects/[id]/team/invite/route.ts`
**What it checks:** Total team members (accepted + pending) vs owner's plan limit

```typescript
const limits = getPlanLimits(ownerPlan);
const totalMembers = existingMembersCount + pendingInvitationsCount;

if (totalMembers >= limits.teamMembersPerProject) {
    return NextResponse.json({
        error: 'Team member limit reached',
        current: totalMembers,
        limit: limits.teamMembersPerProject
    }, { status: 403 });
}
```

**UI Behavior:**
- Client-side check in `/src/app/(dashboard)/settings/team/page.tsx`
- Shows error toast when limit reached

---

## Feature Restrictions

Feature restrictions are **boolean flags** that enable or disable entire features based on plan tier. Unlike numeric limits (which count resources), feature restrictions are simple on/off switches.

### How Feature Restrictions Differ from Limits

| Aspect | Numeric Limits | Feature Restrictions |
|--------|----------------|----------------------|
| Type | Numbers (1, 5, 999999) | Booleans (true/false) |
| Check | Count current vs max | Has feature or not |
| Example | "Can create 5 projects" | "Can share articles publicly" |
| Response | `{ allowed, current, limit }` | `{ allowed, plan, message }` |

### 1. Public Article Sharing

**Feature:** `publicSharing`
**Available on:** Pro and Agency plans only
**Location:** `/src/components/editor/article-editor.tsx`

This feature allows users to generate shareable public links for articles. Free users see a locked section prompting them to upgrade.

**Server-side Check:**
```typescript
// In /src/lib/utils/limit-checker.ts
export async function checkPublicSharingFeature(projectId: string): Promise<FeatureCheckResult> {
    const plan = await getProjectOwnerPlan(projectId);
    const allowed = planHasFeature(plan, 'publicSharing');

    return {
        allowed,
        plan,
        message: allowed
            ? undefined
            : 'Public article sharing is available on Pro and Agency plans. Upgrade to share articles with clients.',
    };
}
```

**API Usage:**
```typescript
const result = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'publicSharing', projectId })
}).then(r => r.json());

if (!result.allowed) {
    // Show upgrade prompt
}
```

**UI Behavior:**

| Plan | UI State |
|------|----------|
| Free | Shows locked section with upgrade prompt, toggle disabled |
| Pro/Agency | Full sharing controls: toggle, copy link, preview link |

**Client-side Implementation:**
```typescript
// Check feature on load
const featureCheck = await fetch('/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'publicSharing', projectId })
}).then(r => r.json());
setCanPublicShare(featureCheck.allowed);

// In the toggle handler (double-check server-side)
const togglePublicShare = async () => {
    // Server-side verification before allowing the action
    const featureCheck = await fetch('/api/limits', { ... });
    if (!featureCheck.allowed) {
        showToast('Public sharing requires Pro or Agency plan');
        return;
    }
    // Proceed with toggle...
};
```

**Important Notes:**
- Existing public links remain accessible even if user downgrades
- The `is_public` flag stays in database; only UI is restricted
- Team members inherit the project owner's feature access
- Both client-side and server-side checks are implemented for security

### Adding a New Feature Restriction

1. Add the feature flag to each plan in `/src/lib/stripe/config.ts`:
   ```typescript
   features: {
       // existing features...
       newFeature: false,  // Free plan
   },
   ```

2. Create a check function in `/src/lib/utils/limit-checker.ts`:
   ```typescript
   export async function checkNewFeature(projectId: string): Promise<FeatureCheckResult> {
       const plan = await getProjectOwnerPlan(projectId);
       const allowed = planHasFeature(plan, 'newFeature');
       return {
           allowed,
           plan,
           message: allowed ? undefined : 'Upgrade message here',
       };
   }
   ```

3. Add a case to `/src/app/api/limits/route.ts`:
   ```typescript
   case 'newFeature':
       if (!projectId) {
           return NextResponse.json({ error: 'projectId required' }, { status: 400 });
       }
       result = await checkNewFeature(projectId);
       break;
   ```

4. Implement UI conditional rendering in the relevant component

---

## API Endpoints

### GET /api/limits
Returns current user's limits and usage.

**Response:**
```json
{
    "plan": "free",
    "ownPlan": "free",
    "isTeamMember": false,
    "teamOwnerPlan": null,
    "limits": {
        "projects": 1,
        "articlesPerProject": 10,
        "nodesPerProject": 20,
        "teamMembersPerProject": 1
    },
    "usage": {
        "projects": 1,
        "teamMembers": 0
    },
    "canManageTeam": true,
    "canCreateProjects": true
}
```

### POST /api/limits
Check a specific limit or feature.

**Request:**
```json
{
    "type": "project" | "article" | "node" | "team" | "publicSharing",
    "projectId": "uuid"  // Required for article, node, team, publicSharing
}
```

**Response (Numeric Limit):**
```json
{
    "allowed": false,
    "current": 20,
    "limit": 20,
    "message": "You've reached your node limit (20). Upgrade your plan to add more nodes."
}
```

**Response (Feature Restriction):**
```json
{
    "allowed": false,
    "plan": "free",
    "message": "Public article sharing is available on Pro and Agency plans. Upgrade to share articles with clients."
}
```

---

## Database Schema

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'agency'
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'past_due', 'cancelled', 'trialing'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Automatic Subscription Creation
When a user signs up, a free subscription is automatically created via database trigger or application logic.

### Plan Changes via Stripe Webhooks
**File:** `/src/app/api/webhooks/stripe/route.ts`

Handled events:
- `checkout.session.completed` - Creates/updates subscription after purchase
- `customer.subscription.updated` - Updates plan when changed
- `customer.subscription.deleted` - Downgrades to free
- `invoice.payment_succeeded` - Marks subscription active
- `invoice.payment_failed` - Marks subscription past_due

---

## How Limits Work for Users

### Project Owner Flow
1. User creates account → Free subscription created
2. User creates project → Counts against their project limit
3. User adds nodes/articles → Counts against project limits (based on owner's plan)
4. User invites team members → Counts against team member limit

### Team Member Flow
1. Owner invites team member by email
2. Team member accepts invitation
3. Team member can access project with owner's plan limits
4. Team member CANNOT create new projects (only owners can)

### Upgrade Flow
1. User clicks upgrade → Stripe checkout
2. Payment successful → Webhook updates subscription
3. Limits immediately increase
4. Previously blocked content (like external link nodes) auto-creates on next save

### Downgrade Flow
1. User cancels subscription or payment fails
2. At period end, plan changes to free
3. Existing content is NOT deleted
4. User cannot create new content beyond free limits
5. User must upgrade or delete content to continue

---

## How to Modify Limits

### Changing Limit Values

**Safe to change:** The numeric limits in `/src/lib/stripe/config.ts`

```typescript
// Example: Increase free plan nodes from 20 to 30
limits: {
    projects: 1,
    articlesPerProject: 10,
    nodesPerProject: 30,  // Changed from 20
    teamMembersPerProject: 1,
},
```

**After changing:**
1. No database migration needed
2. Changes take effect immediately on next API call
3. Existing users automatically get new limits
4. No restart required (Next.js hot reload)

### Adding a New Plan

1. Add to `PLANS` object in `/src/lib/stripe/config.ts`
2. Create Stripe price ID for the plan
3. Add to `PlanType` type
4. Update UI components showing plan options:
   - `/src/app/(marketing)/pricing/page.tsx`
   - `/src/app/(dashboard)/settings/subscription/page.tsx`
5. Update webhook handler if needed

### Adding a New Limit Type

1. Add to `limits` object in each plan config
2. Create check function in `/src/lib/utils/limit-checker.ts`:
   ```typescript
   export async function checkNewLimit(projectId: string): Promise<LimitCheckResult> {
       // Implementation
   }
   ```
3. Add case to `/src/app/api/limits/route.ts` POST handler
4. Add enforcement at the creation point

### Removing a Limit

1. Set limit to `999999` (unlimited) instead of removing
2. This maintains backward compatibility
3. Remove enforcement code if desired (optional)

---

## Testing Limits

### Manual Testing Checklist

**Project Limits (Free = 1):**
- [ ] Create 1st project → Success
- [ ] Try to create 2nd project → Should show limit error
- [ ] Upgrade to Pro → Can create more projects
- [ ] Downgrade → Cannot create beyond limit

**Node Limits (Free = 20):**
- [ ] Add 20 nodes via canvas toolbar → Success
- [ ] Try to add 21st node → Amber banner appears
- [ ] Add external link in article when at limit → Warning shown, link preserved
- [ ] Upgrade to Pro → Can add more nodes
- [ ] Save article with pending external links → Nodes auto-created

**Article Limits (Free = 10):**
- [ ] Create 10 articles → Success
- [ ] Try to create 11th → Error in form
- [ ] Upgrade → Can create more

**Team Limits (Free = 1):**
- [ ] Invite 1 team member → Success
- [ ] Try to invite 2nd → Error shown
- [ ] Upgrade to Pro (limit 3) → Can invite more

### Automated Testing (Recommended)
```typescript
// Example test structure
describe('Plan Limits', () => {
    it('should block project creation at limit', async () => {
        // Create user with free plan
        // Create 1 project (success)
        // Try to create 2nd project (should fail)
    });

    it('should allow more projects after upgrade', async () => {
        // Create user, hit limit
        // Upgrade to Pro
        // Create project (should succeed)
    });
});
```

---

## Important Notes & Edge Cases

### 1. Team Members Inherit Owner's Limits
Team members don't have their own limits. They use the project owner's plan limits. If owner downgrades, team members are also affected.

### 2. External Links and Node Limits
When a user adds external links in an article:
- If at node limit → Link is saved in article content, but external node is NOT created
- When user upgrades and saves article → External nodes are auto-created
- This ensures no data loss

### 3. Subscription Status Matters
Limits only apply when subscription status is `active`. If status is `past_due` or `cancelled`, the user effectively has free plan limits.

### 4. Count Includes All Node Types
Node limit includes ALL node types: pillar, cluster, supporting, planned, AND external. This is intentional.

### 5. Database Has No Hard Constraints
Limits are enforced at application level, not database level. This means:
- Direct database access can bypass limits
- RLS policies don't check limits
- Always use the API for creating resources

### 6. Pending Invitations Count Toward Team Limit
When counting team members, both accepted members AND pending invitations are counted. This prevents users from sending unlimited invitations.

### 7. "Unlimited" is 999,999
For Agency plan, "unlimited" is implemented as 999,999. This is a practical limit that won't be reached but avoids infinity handling issues.

### 8. Limit Checks are Server-Side
All limit checks go through `/api/limits` which uses the admin Supabase client. This ensures:
- Accurate counts
- Cannot be bypassed by client manipulation
- Consistent behavior

---

## File Reference

| Purpose | File Path |
|---------|-----------|
| Plan configuration | `/src/lib/stripe/config.ts` |
| Server-side limit checking | `/src/lib/utils/limit-checker.ts` |
| Client-side limit utilities | `/src/lib/utils/plan-limits.ts` |
| Limits API endpoint | `/src/app/api/limits/route.ts` |
| Project creation (limit enforcement) | `/src/app/(dashboard)/projects/page.tsx` |
| Node creation (limit enforcement) | `/src/components/canvas/canvas-editor.tsx` |
| Article creation (limit enforcement) | `/src/components/editor/new-article-page.tsx` |
| External node creation (limit enforcement) | `/src/components/editor/article-editor.tsx` |
| Team invitation (limit enforcement) | `/src/app/api/projects/[id]/team/invite/route.ts` |
| Stripe webhook handler | `/src/app/api/webhooks/stripe/route.ts` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-09 | Initial implementation of project, node, and article limits |
| 2026-01-09 | Added external node limit enforcement in article editor |
| 2026-01-09 | Created this documentation |
| 2026-01-17 | Added Feature Restrictions section with `publicSharing` feature |
| 2026-01-17 | Added `publicSharing` type to POST /api/limits endpoint |

---

*Last updated: January 17, 2026*
