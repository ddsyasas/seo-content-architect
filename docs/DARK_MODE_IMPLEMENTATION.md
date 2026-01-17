# Dark Mode Implementation

This document describes the dark mode implementation in SyncSEO, including the technical setup, components involved, and styling patterns used throughout the application.

## Table of Contents

1. [Overview](#overview)
2. [Technical Setup](#technical-setup)
3. [Theme Provider](#theme-provider)
4. [Theme Toggle Component](#theme-toggle-component)
5. [Styling Patterns](#styling-patterns)
6. [Pages with Dark Mode Support](#pages-with-dark-mode-support)
7. [Common Color Mappings](#common-color-mappings)
8. [Adding Dark Mode to New Components](#adding-dark-mode-to-new-components)

---

## Overview

SyncSEO uses a class-based dark mode strategy with Tailwind CSS v4. The dark mode is toggled by adding/removing the `dark` class on the `<html>` element, and user preference is persisted in localStorage.

### Key Features
- System preference detection on first visit
- User preference persistence via localStorage
- Smooth transitions between themes
- Consistent styling across all pages

---

## Technical Setup

### Tailwind CSS v4 Configuration

The critical configuration for dark mode in Tailwind CSS v4 is in `src/app/globals.css`:

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));
```

This `@variant` directive is **essential** for dark mode to work in Tailwind v4. It tells Tailwind to apply dark mode styles when the `.dark` class is present on an ancestor element.

### HTML Structure

The dark mode class is applied to the `<html>` element in `src/app/layout.tsx`:

```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

---

## Theme Provider

**File:** `src/components/theme-provider.tsx`

The ThemeProvider component manages the dark mode state and handles:
- Initial theme detection (system preference or localStorage)
- Theme persistence to localStorage
- Applying the `dark` class to the document

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Get stored theme or default to system
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setResolvedTheme(systemTheme);
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      setResolvedTheme(theme);
      root.classList.toggle('dark', theme === 'dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

---

## Theme Toggle Component

**File:** `src/components/ui/theme-toggle.tsx`

A button component that allows users to toggle between light and dark modes:

```tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}
```

### Theme Toggle Locations

The theme toggle is available in:
- **Desktop header:** Next to Login button (all marketing pages)
- **Mobile header:** Next to hamburger menu icon
- **Dashboard sidebar:** In the sidebar navigation
- **Mobile menu:** Inside the expanded mobile navigation

---

## Styling Patterns

### Basic Pattern

For every light mode color class, add a corresponding `dark:` variant:

```tsx
// Text colors
className="text-gray-900 dark:text-white"           // Primary text
className="text-gray-600 dark:text-gray-300"        // Secondary text
className="text-gray-500 dark:text-gray-400"        // Muted text

// Background colors
className="bg-white dark:bg-gray-800"               // Card backgrounds
className="bg-gray-50 dark:bg-gray-900"             // Page backgrounds
className="bg-gray-100 dark:bg-gray-700"            // Subtle backgrounds

// Border colors
className="border-gray-200 dark:border-gray-700"    // Standard borders
className="border-gray-100 dark:border-gray-800"    // Light borders

// Hover states
className="hover:bg-gray-50 dark:hover:bg-gray-700"
className="hover:text-gray-900 dark:hover:text-white"
```

### Colored Elements Pattern

For colored UI elements (badges, icons, etc.):

```tsx
// Indigo (primary brand color)
className="bg-indigo-100 dark:bg-indigo-900/30"
className="text-indigo-600 dark:text-indigo-400"
className="border-indigo-200 dark:border-indigo-800"

// Green (success)
className="bg-green-100 dark:bg-green-900/30"
className="text-green-600 dark:text-green-400"

// Red (error/danger)
className="bg-red-100 dark:bg-red-900/30"
className="text-red-600 dark:text-red-400"

// Purple (agency plan)
className="bg-purple-100 dark:bg-purple-900/30"
className="text-purple-600 dark:text-purple-400"
```

### Form Elements Pattern

```tsx
// Input fields
className="bg-white dark:bg-gray-700
           border-gray-300 dark:border-gray-600
           text-gray-900 dark:text-white
           placeholder:text-gray-400 dark:placeholder:text-gray-500"

// Select dropdowns
className="bg-white dark:bg-gray-800
           border-gray-300 dark:border-gray-600
           text-gray-900 dark:text-white"

// Labels
className="text-gray-700 dark:text-gray-300"
```

### Rich Text Editor (TipTap)

For the TipTap rich text editor, use the `prose-invert` class:

```tsx
editorProps: {
  attributes: {
    class: 'prose prose-lg dark:prose-invert max-w-none',
  },
}
```

### Public Share Pages (Read-Only Article Views)

For public-facing pages that display article content (like the share page), use expanded prose classes for better dark mode support:

```tsx
<div
  className="prose prose-sm sm:prose-lg max-w-none prose-gray dark:prose-invert
             prose-headings:text-gray-900 dark:prose-headings:text-white
             prose-p:text-gray-700 dark:prose-p:text-gray-300
             prose-strong:text-gray-900 dark:prose-strong:text-white
             prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
  dangerouslySetInnerHTML={{ __html: article.content }}
/>
```

Key classes for public share pages:
- `prose-gray` - Better default text colors for light mode
- `dark:prose-invert` - Inverts all prose colors for dark mode
- `prose-p:text-gray-700 dark:prose-p:text-gray-300` - Explicit paragraph colors
- `prose-headings:text-gray-900 dark:prose-headings:text-white` - Heading colors

Public pages should also include a `ThemeToggle` component so viewers can switch themes:

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

// In the header
<div className="flex items-center justify-between">
  <span>Shared Article</span>
  <ThemeToggle />
</div>
```

---

## Pages with Dark Mode Support

### Marketing Pages

| Page | File Path | Status |
|------|-----------|--------|
| Home | `src/app/page.tsx` | ✅ Complete |
| Pricing | `src/app/(marketing)/pricing/page.tsx` | ✅ Complete |
| Contact | `src/app/(marketing)/contact/page.tsx` | ✅ Complete |
| Solutions (all) | `src/app/(marketing)/solutions/*/page.tsx` | ✅ Complete |
| Resources (all) | `src/app/(marketing)/resources/*/page.tsx` | ✅ Complete |

### Legal Pages

| Page | File Path | Status |
|------|-----------|--------|
| Privacy Policy | `src/app/(marketing)/legal/privacy-policy/page.tsx` | ✅ Complete |
| Terms of Service | `src/app/(marketing)/legal/terms-of-service/page.tsx` | ✅ Complete |
| Cookie Policy | `src/app/(marketing)/legal/cookie-policy/page.tsx` | ✅ Complete |
| Refund Policy | `src/app/(marketing)/legal/refund-policy/page.tsx` | ✅ Complete |

### Auth Pages

| Page | File Path | Status |
|------|-----------|--------|
| Login | `src/app/(auth)/login/page.tsx` | ✅ Complete |
| Signup | `src/app/(auth)/signup/page.tsx` | ✅ Complete |
| Auth Layout | `src/app/(auth)/layout.tsx` | ✅ Complete |

### Dashboard Pages

| Page | File Path | Status |
|------|-----------|--------|
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` | ✅ Complete |
| Projects | `src/app/(dashboard)/projects/page.tsx` | ✅ Complete |
| Admin | `src/app/(dashboard)/admin/page.tsx` | ✅ Complete |
| Settings - Profile | `src/app/(dashboard)/settings/profile/page.tsx` | ✅ Complete |
| Settings - Subscription | `src/app/(dashboard)/settings/subscription/page.tsx` | ✅ Complete |
| Settings - Billing | `src/app/(dashboard)/settings/billing/page.tsx` | ✅ Complete |
| Settings - Preferences | `src/app/(dashboard)/settings/preferences/page.tsx` | ✅ Complete |
| Settings - Team | `src/app/(dashboard)/settings/team/page.tsx` | ✅ Complete |

### Editor Components

| Component | File Path | Status |
|-----------|-----------|--------|
| Article Editor | `src/components/editor/article-editor.tsx` | ✅ Complete |
| Rich Text Editor | `src/components/editor/rich-text-editor.tsx` | ✅ Complete |
| SEO Score Panel | `src/components/editor/seo-panel/SEOScorePanel.tsx` | ✅ Complete |
| SEO Category Section | `src/components/editor/seo-panel/SEOCategorySection.tsx` | ✅ Complete |
| SEO Indicator | `src/components/editor/seo-panel/SEOIndicator.tsx` | ✅ Complete |

### Public Pages

| Page | File Path | Status |
|------|-----------|--------|
| Share Page | `src/app/share/[shareId]/page.tsx` | ✅ Complete |

### Layout Components

| Component | File Path | Status |
|-----------|-----------|--------|
| Marketing Layout | `src/components/marketing/marketing-layout.tsx` | ✅ Complete |
| Dashboard Layout | `src/app/(dashboard)/layout.tsx` | ✅ Complete |
| Mega Menu | `src/components/marketing/mega-menu.tsx` | ✅ Complete |
| Project Page Client | `src/components/project/project-page-client.tsx` | ✅ Complete |
| Project Tabs | `src/components/project/project-tabs.tsx` | ✅ Complete |

### UI Components

| Component | File Path | Status |
|-----------|-----------|--------|
| Button | `src/components/ui/button.tsx` | ✅ Complete |
| Card | `src/components/ui/card.tsx` | ✅ Complete |
| Input | `src/components/ui/input.tsx` | ✅ Complete |
| Modal | `src/components/ui/modal.tsx` | ✅ Complete |
| Toast | `src/components/ui/toast.tsx` | ✅ Complete |
| Theme Toggle | `src/components/ui/theme-toggle.tsx` | ✅ Complete |

---

## Common Color Mappings

### Text Colors

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `text-gray-900` | `dark:text-white` | Headings, primary text |
| `text-gray-700` | `dark:text-gray-300` | Labels, secondary headings |
| `text-gray-600` | `dark:text-gray-300` | Body text, descriptions |
| `text-gray-500` | `dark:text-gray-400` | Muted text, captions |
| `text-gray-400` | `dark:text-gray-500` | Placeholder text |

### Background Colors

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `bg-white` | `dark:bg-gray-800` | Cards, modals |
| `bg-white` | `dark:bg-gray-900` | Main content areas |
| `bg-gray-50` | `dark:bg-gray-800` | Subtle card backgrounds |
| `bg-gray-50` | `dark:bg-gray-900` | Page backgrounds |
| `bg-gray-100` | `dark:bg-gray-700` | Hover states, inputs |

### Border Colors

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `border-gray-200` | `dark:border-gray-700` | Card borders, dividers |
| `border-gray-300` | `dark:border-gray-600` | Input borders |
| `border-gray-100` | `dark:border-gray-800` | Subtle borders |

### Brand/Accent Colors

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `text-indigo-600` | `dark:text-indigo-400` | Links, accents |
| `bg-indigo-100` | `dark:bg-indigo-900/30` | Highlight backgrounds |
| `border-indigo-200` | `dark:border-indigo-800` | Accent borders |

---

## Adding Dark Mode to New Components

When creating new components, follow these steps:

### 1. Identify All Color Classes

Look for any Tailwind class that sets a color:
- `text-*`
- `bg-*`
- `border-*`
- `ring-*`
- `shadow-*`
- `placeholder:*`
- `divide-*`

### 2. Add Dark Variants

For each color class, add the appropriate `dark:` variant using the mappings above.

### 3. Handle Hover/Focus States

Don't forget to add dark variants for interactive states:

```tsx
// Before
className="hover:bg-gray-50"

// After
className="hover:bg-gray-50 dark:hover:bg-gray-700"
```

### 4. Test Both Modes

Always test the component in both light and dark modes to ensure:
- Text is readable
- Sufficient contrast exists
- Interactive elements are visible
- Focus states are clear

### 5. Example Template

```tsx
// Example card component with dark mode
export function ExampleCard({ title, description }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        {description}
      </p>
      <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
        Action
      </button>
    </div>
  );
}
```

---

## Troubleshooting

### Dark Mode Not Working

1. **Check globals.css:** Ensure the `@variant dark` directive is present
2. **Check ThemeProvider:** Ensure it wraps the app in layout.tsx
3. **Check class application:** Verify the `dark` class is being added to `<html>`

### Colors Not Changing

1. **Missing dark variant:** Ensure every color class has a `dark:` counterpart
2. **Specificity issues:** Check if other styles are overriding
3. **CSS order:** Ensure Tailwind is imported correctly

### Flash of Wrong Theme

Add `suppressHydrationWarning` to the `<html>` element and ensure theme is applied before render.

---

## Future Improvements

- [ ] Add system preference change listener
- [ ] Consider adding a "system" option in the toggle UI
- [ ] Add transitions for smoother theme switching
- [ ] Consider prefers-reduced-motion for transitions

---

*Last updated: January 2026*
