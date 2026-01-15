# Subscription System Documentation

> Complete technical documentation for the SyncSEO subscription and billing system.

---

## Table of Contents

1. [Overview](#overview)
2. [Plan Structure](#plan-structure)
3. [Tech Stack](#tech-stack)
4. [File Structure](#file-structure)
5. [Database Schema](#database-schema)
6. [Environment Variables](#environment-variables)
7. [Stripe Configuration](#stripe-configuration)
8. [API Endpoints](#api-endpoints)
9. [UI Components](#ui-components)
10. [UI Pages](#ui-pages)
11. [User Flows](#user-flows)
12. [Proration & Billing](#proration--billing)
13. [Payment Error Handling](#payment-error-handling)
14. [Plan Change Confirmation](#plan-change-confirmation)
15. [Webhook Handling](#webhook-handling)
16. [Synchronization System](#synchronization-system)
17. [Toast Notification System](#toast-notification-system)
18. [Email Notifications](#email-notifications)
19. [Troubleshooting](#troubleshooting)

---

## Overview

The subscription system manages user plans, billing, and feature access through integration with **Stripe** for payment processing and **Supabase** for data storage.

### Key Features

- Three-tier plan structure (Free, Pro, Agency)
- Stripe Checkout for new subscriptions
- In-app plan upgrades and downgrades
- Stripe Billing Portal for payment management
- Real-time sync between Stripe and local database
- Webhook handling for payment events
- Toast notifications for user feedback
- Email notifications for subscription events

---

## Plan Structure

### Plan Tiers

| Feature | Free | Pro ($7/mo) | Agency ($49/mo) |
|---------|------|-------------|-----------------|
| Projects | 1 | 5 | Unlimited |
| Articles per Project | 10 | 100 | Unlimited |
| Canvas Nodes per Project | 20 | 200 | Unlimited |
| Team Members per Project | 1 (solo) | 3 | 10 |
| SEO Score | Basic | Full | Full + History |
| Export (PNG, CSV) | No | Yes | Yes |
| Support | Community | Email | Priority |

### Plan Configuration

Defined in: `src/lib/stripe/config.ts`

```typescript
const PLANS_BASE = {
    free: {
        name: 'Free',
        price: 0,
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
        },
    },
    pro: {
        name: 'Pro',
        price: 7, // Promotional price (was $19)
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
        },
    },
    agency: {
        name: 'Agency',
        price: 49,
        limits: {
            projects: 999999, // unlimited
            articlesPerProject: 999999,
            nodesPerProject: 999999,
            teamMembersPerProject: 10,
        },
        features: {
            seoScore: 'full',
            export: true,
            integrations: true,
            support: 'priority',
        },
    },
};
```

### Helper Functions

```typescript
// Get Stripe price ID at runtime (loaded from env vars)
getStripePriceId(plan: string): string | null

// Get plan configuration object
getPlanConfig(plan: string): PlanConfig

// Get plan limits
getPlanLimits(plan: string): PlanLimits

// Check if plan has a feature
planHasFeature(plan: string, feature: string): boolean

// Format price for display
formatPrice(plan: string): string

// Get available upgrade options
getUpgradeOptions(currentPlan: string): PlanType[]

// Get available downgrade options
getDowngradeOptions(currentPlan: string): PlanType[]
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.1.1 |
| Payment | Stripe SDK v20.1.2 |
| Database | Supabase (PostgreSQL) |
| Email | Brevo (SendinBlue) |
| UI | React, Tailwind CSS, Lucide Icons |
| State | React useState, useEffect |
| Notifications | Custom Toast Context |

### Stripe API Version

```typescript
apiVersion: '2025-12-15.clover'
```

---

## File Structure

```
src/
├── lib/
│   └── stripe/
│       └── config.ts              # Stripe initialization, plan configs, helpers
│
├── app/
│   ├── api/
│   │   ├── billing/
│   │   │   ├── create-checkout-session/
│   │   │   │   └── route.ts       # Create Stripe Checkout session
│   │   │   ├── create-portal-session/
│   │   │   │   └── route.ts       # Create Stripe Billing Portal session
│   │   │   ├── update-subscription/
│   │   │   │   └── route.ts       # Upgrade/downgrade existing subscriptions
│   │   │   ├── cancel-subscription/
│   │   │   │   └── route.ts       # Cancel subscription immediately
│   │   │   ├── reactivate-subscription/
│   │   │   │   └── route.ts       # Reactivate pending cancellation
│   │   │   ├── sync-subscription/
│   │   │   │   └── route.ts       # Sync local DB with Stripe status
│   │   │   ├── check-downgrade/
│   │   │   │   └── route.ts       # Check if downgrade is possible
│   │   │   └── send-welcome-email/
│   │   │       └── route.ts       # Send welcome email manually
│   │   │
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts       # Handle Stripe webhook events
│   │
│   ├── (marketing)/
│   │   └── pricing/
│   │       └── page.tsx           # Public pricing page with upgrade buttons
│   │
│   ├── (dashboard)/
│   │   └── settings/
│   │       ├── subscription/
│   │       │   └── page.tsx       # Subscription management page
│   │       └── billing/
│   │           └── page.tsx       # Billing/payment management page
│   │
│   └── checkout/
│       ├── success/
│       │   └── page.tsx           # Post-checkout success page
│       └── cancel/
│           └── page.tsx           # Checkout cancellation page
│
├── components/
│   ├── billing/
│   │   ├── UpgradeModal.tsx       # Modal for upgrade prompts
│   │   ├── PlanChangeModal.tsx    # Confirmation modal for plan changes
│   │   └── UsageIndicator.tsx     # Usage stats display
│   │
│   ├── ui/
│   │   └── toast.tsx              # Toast notification system
│   │
│   └── providers.tsx              # App providers (includes ToastProvider)
│
└── lib/
    └── email/
        └── brevo.ts               # Email sending functions
```

---

## Database Schema

### subscriptions Table

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### profiles Table (Stripe Fields)

```sql
-- Additional fields in profiles table
stripe_customer_id TEXT  -- Stripe customer ID for this user
```

### Key Relationships

- `subscriptions.user_id` → `auth.users.id` (one-to-one)
- `subscriptions.stripe_customer_id` → Stripe Customer object
- `subscriptions.stripe_subscription_id` → Stripe Subscription object
- `profiles.stripe_customer_id` → Stripe Customer object (duplicate for quick access)

---

## Environment Variables

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret
STRIPE_PRO_PRICE_ID=price_xxx          # Pro plan price ID from Stripe
STRIPE_AGENCY_PRICE_ID=price_xxx       # Agency plan price ID from Stripe

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx          # For webhook/admin operations

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Base URL for redirects

# Optional
ENABLE_DEV_MODE=false                  # Enable dev plan switcher (testing only)
```

---

## Stripe Configuration

### Stripe SDK Initialization

The Stripe SDK is lazy-initialized to avoid build-time environment variable access:

```typescript
// src/lib/stripe/config.ts

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }
    return _stripe;
}
```

### Stripe Products Setup

1. **Create Products in Stripe Dashboard**
   - Go to Products → Add Product
   - Create "Pro Plan" and "Agency Plan" products

2. **Create Prices**
   - For each product, create a recurring monthly price
   - Copy the price IDs (e.g., `price_xxx`)

3. **Configure Environment Variables**
   - Set `STRIPE_PRO_PRICE_ID` and `STRIPE_AGENCY_PRICE_ID`

4. **Configure Billing Portal**
   - Go to Settings → Billing → Customer Portal
   - Enable: Update payment methods, View invoices, Cancel subscriptions
   - Set redirect URL to: `{APP_URL}/settings/billing`

5. **Configure Webhooks**
   - Endpoint URL: `{APP_URL}/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

---

## API Endpoints

### POST /api/billing/create-checkout-session

Creates a new Stripe Checkout session for subscription.

**Request:**
```json
{
    "plan": "pro" | "agency"
}
```

**Response:**
```json
{
    "url": "https://checkout.stripe.com/..."
}
```

**Flow:**
1. Authenticate user
2. Validate plan
3. Get/create Stripe customer
4. Create Checkout session with metadata
5. Return checkout URL

---

### POST /api/billing/update-subscription

Updates an existing subscription (upgrade/downgrade).

**Request:**
```json
{
    "plan": "free" | "pro" | "agency"
}
```

**Response (Upgrade):**
```json
{
    "success": true,
    "action": "upgraded",
    "message": "Successfully upgraded to Agency!",
    "newPlan": "agency"
}
```

**Response (Downgrade):**
```json
{
    "success": true,
    "action": "downgrade_scheduled",
    "message": "Your plan will change to Pro at the end of your billing period.",
    "newPlan": "pro",
    "effectiveDate": "2024-02-01T00:00:00Z"
}
```

**Response (Cancel to Free):**
```json
{
    "success": true,
    "action": "cancelled_at_period_end",
    "message": "Your subscription will be cancelled at the end of the billing period."
}
```

**Behavior:**
- **Upgrade**: Immediate change with **immediate proration charge** (difference charged right away)
- **Downgrade (paid→paid)**: Scheduled for end of billing period
- **Downgrade (paid→free)**: Sets `cancel_at_period_end: true`

**Payment Error Response:**
```json
{
    "error": "Payment failed",
    "details": "Your card has insufficient funds. Please use a different card or add funds.",
    "code": "payment_failed"
}
```

---

### POST /api/billing/create-portal-session

Creates a Stripe Billing Portal session.

**Response:**
```json
{
    "url": "https://billing.stripe.com/..."
}
```

**Portal Features:**
- View and download invoices
- Update payment methods
- Update billing address
- Cancel subscription (syncs via webhooks)

---

### POST /api/billing/reactivate-subscription

Reactivates a subscription set to cancel at period end.

**Response:**
```json
{
    "success": true,
    "message": "Your subscription has been reactivated and will continue normally."
}
```

---

### POST /api/billing/sync-subscription

Syncs local database with Stripe's actual subscription status.

**Response:**
```json
{
    "success": true,
    "synced": true,
    "subscription": {
        "plan": "pro",
        "status": "active",
        "cancel_at_period_end": false,
        "current_period_end": "2024-02-01T00:00:00Z",
        "stripe_subscription_id": "sub_xxx",
        "stripe_customer_id": "cus_xxx"
    }
}
```

**Use Cases:**
- Called on page load for subscription-related pages
- Ensures UI reflects Stripe Portal changes
- Handles deleted subscriptions gracefully

---

### POST /api/webhooks/stripe

Handles incoming Stripe webhook events.

**Handled Events:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription record, send welcome email |
| `customer.subscription.updated` | Update plan, status, period end, cancel flag |
| `customer.subscription.deleted` | Downgrade to free, send cancellation email |
| `invoice.payment_succeeded` | Set status to active |
| `invoice.payment_failed` | Set status to past_due, send payment failed email |

---

## UI Components

### UpgradeModal

**File:** `src/components/billing/UpgradeModal.tsx`

**Purpose:** Shows when user hits plan limits, prompts upgrade.

**Props:**
```typescript
interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceType: 'projects' | 'articles' | 'nodes' | 'teamMembers';
    currentLimit: number;
    currentPlan: PlanType;
    hasActiveSubscription?: boolean;
}
```

**Behavior:**
- If user has active subscription → Uses `/api/billing/update-subscription`
- If user is on free plan → Uses `/api/billing/create-checkout-session`

---

### UsageIndicator / UsageOverview

**File:** `src/components/billing/UsageIndicator.tsx`

**Purpose:** Displays current usage vs. plan limits.

**Features:**
- Progress bars for each resource
- Color-coded warnings (green/yellow/red)
- Upgrade prompt when approaching limits

---

### Toast System

**File:** `src/components/ui/toast.tsx`

**Purpose:** Non-intrusive notifications for user feedback.

**Types:**
- `success` - Green, checkmark icon
- `error` - Red, alert icon
- `info` - Blue, info icon
- `warning` - Amber, warning icon

**Usage:**
```typescript
const { addToast } = useToast();

addToast({
    type: 'success',
    title: 'Subscription Updated',
    message: 'Your plan has been upgraded to Pro.',
    duration: 6000, // Optional, default 5000ms
});
```

---

## UI Pages

### Pricing Page

**File:** `src/app/(marketing)/pricing/page.tsx`

**Features:**
- Three pricing cards (Free, Pro, Agency)
- "Most Popular" badge on Pro
- Dynamic button text (Upgrade/Downgrade/Current Plan)
- FAQ section

**Auto-sync:** Calls `/api/billing/sync-subscription` on load.

---

### Subscription Settings Page

**File:** `src/app/(dashboard)/settings/subscription/page.tsx`

**Features:**
- Current plan display with status badge
- Renewal/cancellation date
- Usage overview
- Action buttons:
  - Upgrade
  - Manage Billing
  - Cancel Subscription
  - Reactivate (if cancelling)
- Manual "Refresh status" button
- Dev mode plan switcher (when enabled)

**Auto-sync:** Calls `/api/billing/sync-subscription` on load.

---

### Billing Settings Page

**File:** `src/app/(dashboard)/settings/billing/page.tsx`

**Features:**
- Current plan summary
- Pending cancellation warning
- Stripe Billing Portal button
- Help text for portal capabilities

**Auto-sync:** Calls `/api/billing/sync-subscription` on load.

---

## User Flows

### Flow 1: New Subscription (Free → Paid)

```
User (Free) → Pricing Page → Click "Upgrade to Pro"
                    ↓
        /api/billing/create-checkout-session
                    ↓
            Stripe Checkout Page
                    ↓
            User enters payment info
                    ↓
            Stripe processes payment
                    ↓
        Webhook: checkout.session.completed
                    ↓
        Database updated (plan: 'pro')
                    ↓
            Welcome email sent
                    ↓
        Redirect to /checkout/success
```

### Flow 2: Upgrade (Pro → Agency)

```
User (Pro) → Pricing Page → Click "Upgrade to Agency"
                    ↓
        /api/billing/update-subscription
                    ↓
        Stripe: subscription.update (proration)
                    ↓
        Database updated immediately
                    ↓
        Toast: "Successfully upgraded to Agency!"
                    ↓
            Page refreshes
```

### Flow 3: Downgrade (Agency → Pro)

```
User (Agency) → Pricing Page → Click "Downgrade to Pro"
                    ↓
        /api/billing/update-subscription
                    ↓
        Stripe: subscription.update (schedule)
                    ↓
        Toast: "Your plan will change at period end"
                    ↓
        User keeps Agency features until period ends
                    ↓
        Webhook: customer.subscription.updated (at period end)
                    ↓
        Database updated to 'pro'
```

### Flow 4: Cancel to Free

```
User (Paid) → Settings/Subscription → Click "Cancel Subscription"
                    ↓
            Confirmation dialog
                    ↓
        /api/billing/update-subscription (plan: 'free')
                    ↓
        Stripe: subscription.update (cancel_at_period_end: true)
                    ↓
        Database: cancel_at_period_end = true
                    ↓
        Toast: "Subscription will end at billing period"
                    ↓
        UI shows "Cancelling" badge and reactivate option
                    ↓
        At period end: Webhook subscription.deleted
                    ↓
        Database: plan = 'free', stripe_subscription_id = null
                    ↓
            Cancellation email sent
```

### Flow 5: Reactivate Subscription

```
User (Cancelling) → Settings/Subscription → Click "Reactivate"
                    ↓
        /api/billing/reactivate-subscription
                    ↓
        Stripe: subscription.update (cancel_at_period_end: false)
                    ↓
        Database: cancel_at_period_end = false
                    ↓
        Toast: "Subscription reactivated"
                    ↓
        UI shows "Active" badge
```

### Flow 6: Cancel via Stripe Portal

```
User → Settings/Billing → Click "Manage Billing"
                    ↓
        /api/billing/create-portal-session
                    ↓
            Stripe Billing Portal
                    ↓
        User clicks "Cancel subscription"
                    ↓
            Stripe processes cancellation
                    ↓
        Webhook: customer.subscription.updated
                    ↓
        Database: cancel_at_period_end = true
                    ↓
        User returns to app → Page syncs with Stripe
                    ↓
        /api/billing/sync-subscription (on page load)
                    ↓
            UI shows updated status
```

---

## Proration & Billing

### Upgrade Billing (Immediate Charge)

When a user upgrades from a lower plan to a higher plan (e.g., Pro → Agency), the price difference is **charged immediately** instead of being added to the next invoice.

**Example: Pro ($7) → Agency ($49)**
```
Day of upgrade:
├── User pays $7 for Pro on Jan 1
├── User upgrades to Agency on Jan 15 (mid-cycle)
├── Proration calculated: ~$21 (half month of Agency) - ~$3.50 (unused Pro) = ~$17.50
└── Invoice created and charged IMMEDIATELY

Next billing (Feb 1):
└── User pays $49 (regular Agency price)
```

### Technical Implementation

The upgrade uses `proration_behavior: 'always_invoice'` to create an immediate invoice:

```typescript
// src/app/api/billing/update-subscription/route.ts

const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: subscriptionItemId, price: newPriceId }],
    proration_behavior: 'always_invoice', // Create invoice immediately
    payment_behavior: 'error_if_incomplete', // Fail if payment fails
    cancel_at_period_end: false,
});

// Ensure invoice is paid immediately
const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    status: 'open',
    limit: 1,
});
if (invoices.data.length > 0) {
    await stripe.invoices.pay(invoices.data[0].id);
}
```

### Why Immediate Billing?

| Approach | Next Invoice | User Experience |
|----------|--------------|-----------------|
| **Old (create_prorations)** | $49 + $42 = $91 | Confusing, unexpected large charge |
| **New (always_invoice)** | $49 | Clear, predictable billing |

---

## Payment Error Handling

### Error Detection

The update-subscription endpoint detects specific Stripe error types and returns user-friendly messages:

```typescript
// src/app/api/billing/update-subscription/route.ts

const stripeError = stripeErr as { type?: string; code?: string; decline_code?: string };

if (stripeError.type === 'StripeCardError' || stripeError.code === 'card_declined') {
    const declineCode = stripeError.decline_code || 'unknown';
    // Return specific error message based on decline code
}
```

### Error Codes & Messages

| Stripe Decline Code | User Message |
|---------------------|--------------|
| `insufficient_funds` | "Your card has insufficient funds. Please use a different card or add funds." |
| `card_declined` / `generic_decline` | "Your card was declined. Please try a different payment method." |
| `expired_card` | "Your card has expired. Please update your payment method." |
| `incorrect_cvc` | "The CVC code is incorrect. Please check your card details." |
| `processing_error` | "There was a processing error. Please try again in a moment." |
| `payment_intent_action_required` | "Your bank requires additional verification. Please update your payment method in Billing Settings." |

### Frontend Display

Payment errors are shown as toast notifications with 8-second duration:

```typescript
// src/app/(marketing)/pricing/page.tsx

if (data.code === 'payment_failed') {
    addToast({
        type: 'error',
        title: 'Payment Failed',
        message: data.details, // User-friendly message from backend
        duration: 8000,
    });
}
```

### Error Handling by Scenario

| Scenario | Error Handling |
|----------|----------------|
| **Free → Pro/Agency (new)** | Stripe Checkout handles inline - can't proceed without payment |
| **Pro → Agency (upgrade)** | Backend catches error, frontend shows toast |
| **3D Secure Required** | Backend returns `requires_action` code, prompts user to Billing Settings |

---

## Plan Change Confirmation

### PlanChangeModal Component

**File:** `src/components/billing/PlanChangeModal.tsx`

A confirmation modal that appears before certain plan changes to prevent accidental charges or downgrades.

### When Modal Appears

| Action | Modal? | Reason |
|--------|--------|--------|
| Free → Pro (first time) | ❌ No | Goes directly to Stripe Checkout |
| Free → Agency (first time) | ❌ No | Goes directly to Stripe Checkout |
| **Pro → Agency** | ✅ Yes | Immediate charge, needs confirmation |
| **Returning user → Pro/Agency** | ✅ Yes | Had subscription before, knows the cost |
| **Agency → Pro** | ✅ Yes | Downgrade confirmation |
| **Pro → Free** | ✅ Yes | Subscription cancellation warning |
| **Agency → Free** | ✅ Yes | Subscription cancellation warning |

### Modal Logic

```typescript
// src/app/(marketing)/pricing/page.tsx

const needsModal = 
    // Upgrade with active subscription (instant charge)
    (isUpgrade && hasActiveSubscription && currentPlan !== 'free') ||
    // Returning customer upgrading (had Stripe customer before)
    (isUpgrade && hasStripeCustomer && currentPlan === 'free') ||
    // Any downgrade
    isDowngrade;

if (needsModal) {
    setPendingPlanChange(targetPlan);
    setModalOpen(true);
} else {
    // First-time upgrade from free - goes directly to Stripe Checkout
    handleUpgrade(targetPlan);
}
```

### Returning Customer Detection

Users who previously had a paid subscription are tracked via `stripe_customer_id`:

```typescript
const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

// Track if user ever had a Stripe customer (returning user)
if (subscription.stripe_customer_id) {
    setHasStripeCustomer(true);
}
```

### Modal Styling

| Type | Color | Button Text | Icon |
|------|-------|-------------|------|
| Upgrade | Green | "Upgrade & Pay ~$42" | ↑ Arrow Up |
| Downgrade | Amber | "Downgrade to Pro" | ↓ Arrow Down |
| Cancel to Free | Amber | "Cancel Subscription" | ↓ Arrow Down |

### Modal Content

**Upgrade Modal:**
- Shows the immediate charge amount
- Explains that next billing will be regular price
- Green styling to encourage action

**Downgrade Modal:**
- Explains change takes effect at period end
- For free: warns subscription will be cancelled
- Amber styling to encourage careful consideration

---

## Webhook Handling

**File:** `src/app/api/webhooks/stripe/route.ts`

### Webhook Security

```typescript
// Verify webhook signature
const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
);
```

### Event Handlers

#### checkout.session.completed

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // Extract metadata
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Upsert subscription
    await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: plan,
        status: 'active',
        cancel_at_period_end: false,
    });

    // Send welcome email
    await sendWelcomeSubscriptionEmail({ to, plan });
}
```

#### customer.subscription.updated

```typescript
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price.id;
    let plan = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro';
    if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) plan = 'agency';

    // Determine status
    let status = 'active';
    if (subscription.status === 'past_due') status = 'past_due';
    if (subscription.status === 'canceled') status = 'cancelled';

    // Update database
    await supabase.from('subscriptions').update({
        plan,
        status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000),
    }).eq('stripe_customer_id', subscription.customer);
}
```

#### customer.subscription.deleted

```typescript
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Downgrade to free
    await supabase.from('subscriptions').update({
        plan: 'free',
        status: 'active',
        stripe_subscription_id: null,
        cancel_at_period_end: false,
    }).eq('stripe_customer_id', subscription.customer);

    // Send cancellation email
    await sendSubscriptionCancelledEmail({ to, endDate });
}
```

#### invoice.payment_failed

```typescript
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Update status to past_due
    await supabase.from('subscriptions').update({
        status: 'past_due',
    }).eq('stripe_customer_id', invoice.customer);

    // Send payment failed email
    await sendPaymentFailedEmail({ to, retryDate });
}
```

---

## Synchronization System

### Why Sync is Needed

When users make changes in the Stripe Billing Portal (cancel, update payment, etc.), our app doesn't know about it until:
1. A webhook is received (can be delayed)
2. The user triggers a sync

### Sync Endpoint

**File:** `src/app/api/billing/sync-subscription/route.ts`

```typescript
export async function POST(request: NextRequest) {
    // 1. Get user's subscription from our database
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('user_id', user.id)
        .single();

    // 2. If no Stripe subscription, nothing to sync
    if (!subscription?.stripe_subscription_id) {
        return { success: true, synced: false };
    }

    // 3. Fetch actual status from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
    );

    // 4. Determine plan from price ID
    const priceId = stripeSubscription.items.data[0]?.price.id;
    let plan = 'free';
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro';
    if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) plan = 'agency';

    // 5. Update our database
    await supabase.from('subscriptions').update({
        plan,
        status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end,
    }).eq('user_id', user.id);

    // 6. Return synced data directly (avoid race conditions)
    return {
        success: true,
        synced: true,
        subscription: {
            plan,
            status,
            cancel_at_period_end,
            current_period_end,
            stripe_subscription_id,
            stripe_customer_id,
        }
    };
}
```

### Auto-Sync on Page Load

All subscription-related pages call sync on load:

```typescript
// src/app/(dashboard)/settings/subscription/page.tsx
useEffect(() => {
    // Sync with Stripe on initial load
    loadData(true); // true = sync first
}, []);

const loadData = async (syncWithStripe = false) => {
    if (syncWithStripe) {
        const syncResponse = await fetch('/api/billing/sync-subscription', {
            method: 'POST',
        });
        const syncData = await syncResponse.json();

        // Use synced data directly - don't re-read from database
        // This prevents race conditions
        if (syncData.success && syncData.subscription) {
            setSubscription(syncData.subscription);
            return;
        }
    }

    // Fallback to database read
    const { data } = await supabase.from('subscriptions')...
};
```

### Pages with Auto-Sync

- `/pricing` - Pricing page
- `/settings/subscription` - Subscription settings
- `/settings/billing` - Billing settings

---

## Toast Notification System

### Setup

**Provider:** `src/components/providers.tsx`

```typescript
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
```

**Root Layout:** `src/app/layout.tsx`

```typescript
import { Providers } from '@/components/providers';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
```

### Usage Examples

```typescript
const { addToast } = useToast();

// Success
addToast({
    type: 'success',
    title: 'Plan Upgraded!',
    message: 'You\'ve been upgraded to Agency. Any unused time has been credited.',
    duration: 6000,
});

// Error
addToast({
    type: 'error',
    title: 'Update Failed',
    message: 'Failed to update subscription. Please try again.',
});

// Info
addToast({
    type: 'info',
    title: 'Downgrade Scheduled',
    message: 'Your plan will change to Pro at the end of your billing period.',
    duration: 6000,
});

// Warning
addToast({
    type: 'warning',
    title: 'Payment Due',
    message: 'Please update your payment method to avoid service interruption.',
});
```

### Toast Styling

- Position: Bottom-right corner
- Animation: Slide-in from right with fade
- Auto-dismiss: Configurable duration (default 5 seconds)
- Manual dismiss: X button

---

## Email Notifications

**File:** `src/lib/email/brevo.ts`

### Email Types

| Function | Trigger | Content |
|----------|---------|---------|
| `sendWelcomeSubscriptionEmail` | checkout.session.completed | Welcome message, plan features |
| `sendSubscriptionCancelledEmail` | customer.subscription.deleted | Confirmation, access end date |
| `sendPaymentFailedEmail` | invoice.payment_failed | Alert, retry date, update link |

### Email Configuration

Emails are sent via Brevo (SendinBlue) API. Configure:
- `BREVO_API_KEY` - API key from Brevo dashboard
- Template IDs for each email type

---

## Troubleshooting

### "No such customer" Error

**Cause:** Stripe customer ID in database doesn't exist in Stripe (deleted, or wrong mode).

**Fix:**
1. Go to Supabase → profiles table
2. Find user's row
3. Clear the `stripe_customer_id` field
4. User can now subscribe (new customer will be created)

### Multiple Subscriptions Created

**Cause:** Creating new checkout sessions instead of updating existing subscriptions.

**Fix:** The `update-subscription` endpoint handles this. Ensure:
- Pricing page checks `hasActiveSubscription` before choosing endpoint
- UpgradeModal uses update endpoint for existing subscribers

### Subscription Status Not Updating

**Cause:** Webhook not received or page not syncing.

**Fix:**
1. Check webhook logs in Stripe Dashboard
2. Verify webhook endpoint URL is correct
3. Use "Refresh status" button to force sync
4. Check `sync-subscription` endpoint logs

### "Plan not available for purchase" Error

**Cause:** Missing Stripe price ID environment variable.

**Fix:**
1. Verify `STRIPE_PRO_PRICE_ID` and `STRIPE_AGENCY_PRICE_ID` are set
2. Ensure correct mode (test vs. live)
3. Restart server after adding env vars

### Webhook Signature Verification Failed

**Cause:** Wrong webhook secret or request body modified.

**Fix:**
1. Get webhook secret from Stripe Dashboard → Webhooks
2. Update `STRIPE_WEBHOOK_SECRET` env var
3. Ensure raw request body is used (not parsed JSON)

### Dev Mode Testing

Enable dev mode to bypass Stripe and test plan limits:

```env
ENABLE_DEV_MODE=true
```

This shows a plan switcher on the Subscription settings page that directly updates the database without Stripe.

**Important:** Never enable in production!

---

## Quick Reference

### Key Files

| Purpose | File |
|---------|------|
| Stripe Config | `src/lib/stripe/config.ts` |
| New Subscription | `src/app/api/billing/create-checkout-session/route.ts` |
| Update Subscription | `src/app/api/billing/update-subscription/route.ts` |
| Webhooks | `src/app/api/webhooks/stripe/route.ts` |
| Sync | `src/app/api/billing/sync-subscription/route.ts` |
| Pricing UI | `src/app/(marketing)/pricing/page.tsx` |
| Subscription Settings | `src/app/(dashboard)/settings/subscription/page.tsx` |
| Billing Settings | `src/app/(dashboard)/settings/billing/page.tsx` |
| Toast System | `src/components/ui/toast.tsx` |
| Plan Change Modal | `src/components/billing/PlanChangeModal.tsx` |

### Key URLs

| URL | Purpose |
|-----|---------|
| `/pricing` | Public pricing page |
| `/settings/subscription` | Manage subscription |
| `/settings/billing` | Manage billing/payments |
| `/checkout/success` | Post-checkout success |
| `/checkout/cancel` | Checkout cancellation |
| `/api/webhooks/stripe` | Webhook endpoint |

### Plan Order (for upgrade/downgrade logic)

```typescript
const planOrder = { free: 0, pro: 1, agency: 2 };
// Lower number → higher number = upgrade
// Higher number → lower number = downgrade
```

---

*Last updated: January 15, 2026*

