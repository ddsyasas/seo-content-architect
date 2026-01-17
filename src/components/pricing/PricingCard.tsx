'use client';

import Link from 'next/link';
import { Check, X, Sparkles } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';

interface PricingCardProps {
  plan: PlanType;
  /** Where the button should link to. Defaults to /pricing */
  href?: string;
  /** Custom button text. If not provided, uses default based on plan */
  buttonText?: string;
  /** Whether this is the featured/highlighted card */
  featured?: boolean;
}

/**
 * Reusable pricing card component that reads from PLANS config.
 * Used on homepage and can be used elsewhere for consistent pricing display.
 *
 * For full checkout functionality, use the pricing page directly.
 */
export function PricingCard({
  plan,
  href = '/pricing',
  buttonText,
  featured: featuredOverride,
}: PricingCardProps) {
  const config = PLANS[plan];
  const isPro = plan === 'pro';
  const featured = featuredOverride ?? isPro;

  // Build feature list from config
  const features = [
    {
      name: config.limits.projects === 999999
        ? 'Unlimited projects'
        : `${config.limits.projects} project${config.limits.projects !== 1 ? 's' : ''}`,
      included: true,
    },
    {
      name: config.limits.nodesPerProject === 999999
        ? 'Unlimited canvas nodes'
        : `${config.limits.nodesPerProject} canvas nodes`,
      included: true,
    },
    {
      name: config.limits.articlesPerProject === 999999
        ? 'Unlimited articles'
        : `${config.limits.articlesPerProject} articles${plan !== 'free' ? ' per project' : ''}`,
      included: true,
    },
    {
      name: config.features.seoScore === 'basic' ? 'Basic SEO score' : 'Full SEO analysis',
      included: true,
    },
    {
      name: 'Public article sharing',
      included: config.features.publicSharing,
    },
    {
      name: config.limits.teamMembersPerProject === 1
        ? 'Solo (owner only)'
        : `${config.limits.teamMembersPerProject} team members`,
      included: true,
    },
    {
      name: plan === 'agency' ? 'Priority support' : plan === 'pro' ? 'Email support' : 'Community support',
      included: true,
    },
  ];

  // Default button text
  const defaultButtonText = plan === 'free' ? 'Start Free' : `Get ${config.name}`;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 flex flex-col ${
        featured
          ? 'border-2 border-indigo-500 shadow-xl scale-[1.02] lg:scale-105'
          : 'border border-gray-200 dark:border-gray-700 shadow-sm'
      }`}
    >
      {/* Most Popular Badge */}
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {config.name}
      </h3>

      {/* Price */}
      {isPro ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl text-gray-400 line-through dark:text-gray-500">$19</span>
            <span className="text-4xl font-bold text-gray-900 dark:text-white">${config.price}</span>
            <span className="text-gray-500 dark:text-gray-400">/month</span>
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-green-900/50 dark:text-green-400">
              63% OFF - Limited Time
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {config.price === 0 ? 'Free' : `$${config.price}`}
            </span>
            {config.price > 0 && (
              <span className="text-gray-500 dark:text-gray-400">/month</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {plan === 'free' ? 'Perfect for trying out SyncSEO' : 'For teams and agencies'}
          </p>
        </>
      )}

      {/* Features List */}
      <ul className="mt-6 space-y-3 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            {feature.included ? (
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <X className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <Link href={href} className="block mt-6">
        <Button
          variant={featured ? 'primary' : 'outline'}
          className="w-full"
        >
          {buttonText || defaultButtonText}
        </Button>
      </Link>
    </div>
  );
}

/**
 * A complete pricing section with all three plan cards.
 * Useful for embedding pricing on various pages.
 */
export function PricingCards({
  href = '/pricing',
}: {
  href?: string;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
      <PricingCard plan="free" href={href} />
      <PricingCard plan="pro" href={href} featured />
      <PricingCard plan="agency" href={href} />
    </div>
  );
}
