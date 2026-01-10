import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time env access
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

// Keep stripe export for backwards compatibility - using getter
export const stripe = {
    get checkout() { return getStripe().checkout; },
    get customers() { return getStripe().customers; },
    get subscriptions() { return getStripe().subscriptions; },
    get billingPortal() { return getStripe().billingPortal; },
    get webhooks() { return getStripe().webhooks; },
};

// Plan configuration
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
            seoScore: 'basic', // score only
            export: false,
            integrations: false,
            support: 'community',
        },
    },
    pro: {
        name: 'Pro',
        price: 7, // Promotional price (was $19)
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
        limits: {
            projects: 5,
            articlesPerProject: 100,
            nodesPerProject: 200,
            teamMembersPerProject: 3,
        },
        features: {
            seoScore: 'full', // score + all indicators
            export: true,
            integrations: false, // future
            support: 'email',
        },
    },
    agency: {
        name: 'Agency',
        price: 49,
        stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
        limits: {
            projects: 999999, // unlimited
            articlesPerProject: 999999,
            nodesPerProject: 999999,
            teamMembersPerProject: 10,
        },
        features: {
            seoScore: 'full', // + history tracking
            export: true,
            integrations: true, // future: all + API access
            support: 'priority',
        },
    },
} as const;

export type PlanType = keyof typeof PLANS;
export type PlanConfig = typeof PLANS[PlanType];

// Get plan configuration
export function getPlanConfig(plan: string): PlanConfig {
    return PLANS[plan as PlanType] || PLANS.free;
}

// Get plan limits
export function getPlanLimits(plan: string) {
    return getPlanConfig(plan).limits;
}

// Check if a plan has a feature
export function planHasFeature(plan: string, feature: keyof PlanConfig['features']): boolean {
    const config = getPlanConfig(plan);
    const featureValue = config.features[feature];
    return featureValue === true || featureValue === 'full';
}

// Format price for display
export function formatPrice(plan: string): string {
    const config = getPlanConfig(plan);
    if (config.price === 0) return 'Free';
    return `$${config.price}/month`;
}

// Get upgrade options for a plan
export function getUpgradeOptions(currentPlan: string): PlanType[] {
    const planOrder: PlanType[] = ['free', 'pro', 'agency'];
    const currentIndex = planOrder.indexOf(currentPlan as PlanType);
    return planOrder.slice(currentIndex + 1);
}

// Get downgrade options for a plan
export function getDowngradeOptions(currentPlan: string): PlanType[] {
    const planOrder: PlanType[] = ['free', 'pro', 'agency'];
    const currentIndex = planOrder.indexOf(currentPlan as PlanType);
    return planOrder.slice(0, currentIndex);
}
