# SyncSEO - SEO Implementation Guide

This document provides comprehensive documentation of the SEO implementation for SyncSEO. Use this as a reference when making SEO-related changes or when onboarding new team members.

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Favicon & Branding](#favicon--branding)
4. [Featured Image (OG Image)](#featured-image-og-image)
5. [Configuration Files](#configuration-files)
6. [Robots.txt](#robotstxt)
7. [Sitemap](#sitemap)
8. [Metadata Configuration](#metadata-configuration)
9. [Structured Data (JSON-LD)](#structured-data-json-ld)
10. [Open Graph & Twitter Cards](#open-graph--twitter-cards)
11. [Page Indexing Strategy](#page-indexing-strategy)
12. [Adding New Pages](#adding-new-pages)
13. [Testing SEO](#testing-seo)
14. [Maintenance Checklist](#maintenance-checklist)

---

## Overview

SyncSEO uses Next.js App Router for SEO optimization with the following features:

- **Dynamic sitemap generation** - Automatically includes all marketing pages
- **Comprehensive metadata** - Title, description, keywords for each page
- **Structured data** - Organization, Website, and SoftwareApplication schemas
- **Open Graph & Twitter Cards** - Social media optimization
- **Selective indexing** - Marketing pages indexed, app pages excluded

### Key Principles

1. **Marketing pages are indexed** - Home, pricing, solutions, resources
2. **App pages are NOT indexed** - Dashboard, projects, settings, user content
3. **Auth pages are NOT indexed** - Login, signup, password reset
4. **Legal pages are NOT indexed** - Privacy policy, terms, cookies, refund

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with global SEO config
│   ├── sitemap.ts              # Dynamic sitemap generator
│   ├── (auth)/
│   │   └── layout.tsx          # noindex for auth pages
│   ├── (dashboard)/
│   │   └── layout.tsx          # noindex for dashboard pages
│   └── (marketing)/
│       ├── layout.tsx          # index for marketing pages
│       ├── pricing/
│       │   └── layout.tsx      # Page-specific metadata
│       ├── solutions/
│       │   ├── layout.tsx
│       │   └── [slug]/
│       │       └── layout.tsx  # Per-solution metadata
│       ├── resources/
│       │   ├── layout.tsx
│       │   └── [slug]/
│       │       └── layout.tsx  # Per-resource metadata
│       └── legal/
│           └── layout.tsx      # noindex for legal pages
├── lib/
│   └── seo/
│       ├── config.ts           # Central SEO configuration
│       └── generate-metadata.ts # Metadata generators
public/
├── robots.txt                  # Crawler instructions
├── favicon.ico                 # Browser favicon (Google search results)
├── apple-touch-icon.ico        # iOS home screen icon
├── SyncSEO Header logo 2-min.png # Logo (indexed)
└── SyncSEO.io Featured Image 01.webp # OG image (indexed)
```

---

## Favicon & Branding

The favicon appears in browser tabs and **Google search results** next to your site listing.

### Current Favicon Files

| File | Location | Purpose |
|------|----------|---------|
| `favicon.ico` | `/public/favicon.ico` | Browser tabs, Google search results |
| `favicon.ico` | `/src/app/favicon.ico` | Next.js App Router auto-detection |
| `apple-touch-icon.ico` | `/public/apple-touch-icon.ico` | iOS home screen icon |

### Source Files (for future updates)

| File | Location | Description |
|------|----------|-------------|
| `SyncSEO-favicon.ico` | `/src/app/` | Original favicon |
| `SyncSEO LOGO 02.45.ico` | `/src/app/` | Full-size icon (used for apple-touch-icon) |

### How to Change the Favicon

1. Create a new `.ico` file (recommended sizes: 16x16, 32x32, or multi-resolution)
2. Replace both files:
   - `/public/favicon.ico`
   - `/src/app/favicon.ico`
3. For iOS/Apple devices, also update `/public/apple-touch-icon.ico`
4. Clear browser cache and verify

### Favicon in Google Search Results

Google displays favicons in search results. Requirements:
- Must be a multiple of 48x48 pixels (Google resizes to 16x16)
- Must be accessible at `/favicon.ico`
- File must be valid ICO, PNG, or SVG format
- Google may take days/weeks to update favicon in search results

---

## Featured Image (OG Image)

The featured image (Open Graph image) appears when links are shared on social media platforms like Facebook, Twitter, LinkedIn, and messaging apps.

### Current Featured Image

| Property | Value |
|----------|-------|
| **File** | `SyncSEO.io Featured Image 01.webp` |
| **Location** | `/public/SyncSEO.io Featured Image 01.webp` |
| **URL** | `https://syncseo.io/SyncSEO.io Featured Image 01.webp` |
| **Dimensions** | 1200 x 630 pixels (recommended) |
| **Format** | WebP |

### How to Change the Featured Image

1. **Create new image**:
   - Recommended size: **1200 x 630 pixels** (1.91:1 aspect ratio)
   - Formats: WebP (preferred), PNG, or JPG
   - Keep important content in center (some platforms crop edges)

2. **Replace the file**:
   ```bash
   # Replace the file in public folder
   cp /path/to/new-image.webp public/SyncSEO.io\ Featured\ Image\ 01.webp
   ```

3. **If changing filename**, update the config:
   ```typescript
   // /src/lib/seo/config.ts
   export const siteConfig = {
       // ...
       ogImage: 'https://syncseo.io/YOUR-NEW-FILENAME.webp',
       // ...
   };
   ```

4. **Test the change**:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

### Where Featured Image is Used

The featured image is configured in:
- `/src/lib/seo/config.ts` - `siteConfig.ogImage`
- `/src/app/layout.tsx` - Root layout Open Graph tags
- All page layouts via `generateSolutionMetadata()` and `generateResourceMetadata()`

All marketing pages automatically use this image when shared.

---

## Configuration Files

### `/src/lib/seo/config.ts`

Central configuration for all SEO-related settings:

```typescript
export const siteConfig = {
    name: 'SyncSEO',
    title: 'SyncSEO - Visual Content Architecture Planning for SEO',
    description: '...',
    url: 'https://syncseo.io',
    ogImage: 'https://syncseo.io/SyncSEO.io Featured Image 01.webp',
    logo: 'https://syncseo.io/SyncSEO Header logo 2-min.png',
    keywords: [...],
    // ... more config
};
```

### `/src/lib/seo/generate-metadata.ts`

Helper functions for generating page-specific metadata:

```typescript
// Generate solution page metadata
generateSolutionMetadata('marketing-managers')

// Generate resource page metadata
generateResourceMetadata('blog')

// Generate WebPage structured data
generateWebPageStructuredData(title, description, url, breadcrumbs)
```

---

## Robots.txt

Location: `/public/robots.txt`

### Allowed Paths
- `/` - Home page
- `/pricing` - Pricing page
- `/solutions/*` - All solution pages
- `/resources/*` - All resource pages
- `/*.webp$`, `/*.png$`, `/*.jpg$` - All images

### Disallowed Paths
- `/dashboard` - User dashboard
- `/projects`, `/project/*` - User projects
- `/settings/*` - User settings
- `/team`, `/invite/*` - Team management
- `/login`, `/signup`, `/forgot-password`, `/reset-password` - Auth
- `/checkout/*` - Checkout flow
- `/admin` - Admin panel
- `/legal/*` - Legal pages
- `/api/*` - API routes

### Updating robots.txt

Edit `/public/robots.txt` directly. Changes take effect immediately.

---

## Sitemap

Location: `/src/app/sitemap.ts`

The sitemap is dynamically generated and includes:

| Page Type | Priority | Change Frequency |
|-----------|----------|------------------|
| Home | 1.0 | weekly |
| Pricing | 0.9 | weekly |
| Solutions | 0.8 | monthly |
| Resources (blog, why-syncseo) | 0.8 | monthly |
| Resources (others) | 0.6-0.7 | monthly |

### Adding Pages to Sitemap

Edit `/src/app/sitemap.ts`:

```typescript
// Add to the appropriate array:
const marketingPages = [
    // ... existing pages
    {
        url: `${baseUrl}/new-page`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.7,
    },
];
```

### Accessing Sitemap

- URL: `https://syncseo.io/sitemap.xml`
- Submitted to Google Search Console

---

## Metadata Configuration

### Root Layout (`/src/app/layout.tsx`)

Global metadata applied to all pages:

- **Title template**: `%s | SyncSEO`
- **Default title**: `SyncSEO - Visual Content Architecture Planning for SEO`
- **Keywords**: Content architecture, SEO planning, etc.
- **Open Graph**: Site-wide defaults
- **Twitter Card**: Site-wide defaults

### Page-Specific Metadata

Each marketing page has its own layout.tsx with metadata:

```typescript
// Example: /src/app/(marketing)/pricing/layout.tsx
import { generatePricingMetadata } from '@/lib/seo/generate-metadata';

export const metadata = {
    title: 'Pricing - SyncSEO | Affordable Content Planning',
    description: '...',
    keywords: [...],
    // ...
};
```

### Metadata Properties

| Property | Description | Example |
|----------|-------------|---------|
| `title` | Page title | "Pricing - SyncSEO" |
| `description` | Meta description (150-160 chars) | "Simple, transparent pricing..." |
| `keywords` | Target keywords | ['SEO tool pricing', ...] |
| `alternates.canonical` | Canonical URL | "https://syncseo.io/pricing" |
| `openGraph` | Facebook/LinkedIn sharing | See OG section |
| `twitter` | Twitter sharing | See Twitter section |

---

## Structured Data (JSON-LD)

### Organization Schema

Applied globally in root layout:

```json
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SyncSEO",
    "url": "https://syncseo.io",
    "logo": "https://syncseo.io/SyncSEO Header logo 2-min.png",
    "email": "hi@syncseo.io"
}
```

### Website Schema

Applied globally:

```json
{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SyncSEO",
    "url": "https://syncseo.io",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://syncseo.io/search?q={search_term_string}"
    }
}
```

### SoftwareApplication Schema

Applied globally:

```json
{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SyncSEO",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "featureList": [
        "Visual content canvas",
        "Drag-and-drop interface",
        ...
    ]
}
```

### Testing Structured Data

Use Google's Rich Results Test: https://search.google.com/test/rich-results

---

## Open Graph & Twitter Cards

### Featured Image

- **File**: `/public/SyncSEO.io Featured Image 01.webp`
- **URL**: `https://syncseo.io/SyncSEO.io Featured Image 01.webp`
- **Dimensions**: 1200x630 (recommended for OG)
- **Format**: WebP

### Open Graph Tags

```html
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Page description..." />
<meta property="og:image" content="https://syncseo.io/SyncSEO.io Featured Image 01.webp" />
<meta property="og:url" content="https://syncseo.io/page" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="SyncSEO" />
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Page description..." />
<meta name="twitter:image" content="https://syncseo.io/SyncSEO.io Featured Image 01.webp" />
<meta name="twitter:site" content="@syncseo" />
```

### Testing Social Sharing

- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: https://www.linkedin.com/post-inspector/

---

## Page Indexing Strategy

### Indexed Pages (robots: index, follow)

| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/pricing` | Pricing page |
| `/solutions/*` | All solution pages |
| `/resources/*` | All resource pages (except legal) |

### Not Indexed Pages (robots: noindex, nofollow)

| Route | Reason |
|-------|--------|
| `/dashboard` | Private user content |
| `/projects`, `/project/*` | Private user content |
| `/settings/*` | Private user settings |
| `/team`, `/invite/*` | Private team management |
| `/admin` | Admin-only |
| `/login`, `/signup` | Auth pages |
| `/forgot-password`, `/reset-password` | Auth pages |
| `/checkout/*` | Checkout flow |
| `/legal/*` | Low SEO value |
| `/api/*` | API endpoints |

### Implementation

Indexing is controlled via layout.tsx files:

```typescript
// For indexed pages:
export const metadata: Metadata = {
    robots: {
        index: true,
        follow: true,
    },
};

// For non-indexed pages:
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};
```

---

## Adding New Pages

### 1. Marketing Page (Should be indexed)

1. Create page in `/src/app/(marketing)/[section]/[slug]/page.tsx`
2. Add metadata configuration to `/src/lib/seo/config.ts`:

```typescript
// In pageMetadata.resources or pageMetadata.solutions:
'new-page': {
    title: 'New Page Title | SyncSEO',
    description: 'Page description (150-160 chars)',
    keywords: ['keyword1', 'keyword2'],
},
```

3. Create layout.tsx in the page directory:

```typescript
import { generateResourceMetadata } from '@/lib/seo/generate-metadata';

export const metadata = generateResourceMetadata('new-page');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
```

4. Add to sitemap in `/src/app/sitemap.ts`:

```typescript
{ slug: 'new-page', priority: 0.7 },
```

### 2. App Page (Should NOT be indexed)

No additional SEO configuration needed - the dashboard layout already sets noindex.

---

## Testing SEO

### Tools

1. **Google Search Console** - Monitor indexing and search performance
2. **Google Rich Results Test** - Test structured data
3. **PageSpeed Insights** - Performance and Core Web Vitals
4. **Lighthouse** - SEO audit in Chrome DevTools
5. **Screaming Frog** - Crawl site for SEO issues

### Checklist for New Pages

- [ ] Page has unique title (50-60 characters)
- [ ] Page has unique description (150-160 characters)
- [ ] Page has relevant keywords
- [ ] Page has canonical URL
- [ ] Page has Open Graph tags
- [ ] Page has Twitter Card tags
- [ ] Page is in sitemap (if indexed)
- [ ] Page has correct robots directive
- [ ] Images have alt text
- [ ] Internal links use descriptive anchor text

---

## Maintenance Checklist

### Weekly
- [ ] Check Google Search Console for errors
- [ ] Monitor Core Web Vitals

### Monthly
- [ ] Review search performance in Search Console
- [ ] Update sitemap if new pages added
- [ ] Check for broken links

### Quarterly
- [ ] Audit page titles and descriptions
- [ ] Review keyword rankings
- [ ] Update structured data if features change
- [ ] Test social sharing cards

### After Major Changes
- [ ] Regenerate sitemap
- [ ] Submit updated sitemap to Search Console
- [ ] Test affected pages with Rich Results Test
- [ ] Clear CDN cache if applicable

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `/public/robots.txt` | Crawler rules |
| `/src/app/sitemap.ts` | Sitemap generator |
| `/src/lib/seo/config.ts` | SEO configuration |
| `/src/lib/seo/generate-metadata.ts` | Metadata helpers |
| `/src/app/layout.tsx` | Global SEO settings |

### Important URLs

| URL | Description |
|-----|-------------|
| https://syncseo.io/sitemap.xml | Sitemap |
| https://syncseo.io/robots.txt | Robots file |
| https://search.google.com/search-console | Search Console |

### Contact

For SEO-related questions: hi@syncseo.io

---

*Last updated: January 2025*
