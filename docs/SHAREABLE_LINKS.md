# Shareable Links Implementation

This document describes the public shareable links feature in SyncSEO, including database schema, API implementation, UI components, and SEO considerations.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Routes](#api-routes)
4. [Frontend Implementation](#frontend-implementation)
5. [SEO & Indexing](#seo--indexing)
6. [Rollback Scripts](#rollback-scripts)

---

## Overview

The shareable links feature allows writers to generate public URLs for their articles. When sharing is enabled:
- A unique UUID-based share link is generated
- Anyone with the link can view the article (no authentication required)
- The shared view includes article content, SEO score, and article metadata
- Sharing can be toggled on/off at any time

### Key Features
- UUID-based share IDs (not node IDs) for security
- Real-time SEO score calculation on shared pages
- Mobile-responsive design
- Dark mode support
- Toggle to enable/disable sharing instantly

---

## Database Schema

### Columns Added to `nodes` Table

The columns are managed via Prisma schema (`prisma/schema.prisma`):

```prisma
model nodes {
  // ... other fields
  is_public  Boolean?  @default(false)
  share_id   String?   @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  @@index([share_id], map: "idx_nodes_share_id")
}
```

**Equivalent SQL:**
```sql
-- Add columns to nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS share_id UUID DEFAULT gen_random_uuid();

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_nodes_share_id ON nodes(share_id);
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `is_public` | BOOLEAN | `false` | Whether the article is publicly shareable |
| `share_id` | UUID | `gen_random_uuid()` | Unique identifier for the share URL |

---

## API Routes

All database operations use **Prisma ORM** to bypass Supabase RLS policies.

### GET /api/share/[shareId]

**File:** `src/app/api/share/[shareId]/route.ts`

Fetches shared article data by share ID. Public access (no authentication required).

```typescript
// Response
{
  node: {
    id: string;
    title: string;
    slug: string | null;
    target_keyword: string | null;
    status: string;
    node_type: string;
    created_at: string;
    assigned_to: string | null;
  };
  article: {
    content: string;
    word_count: number;
    seo_title: string | null;
    seo_description: string | null;
  } | null;
  project: {
    name: string;
    domain: string | null;
  } | null;
}
```

### PATCH /api/nodes/[nodeId]/share

**File:** `src/app/api/nodes/[nodeId]/share/route.ts`

Toggle public sharing for a node. Requires authentication.

```typescript
// Request body
{ isPublic: boolean }

// Response
{
  success: true,
  isPublic: boolean,
  shareId: string
}
```

### GET /api/nodes/[nodeId]/share

Get current share status for a node. Requires authentication.

```typescript
// Response
{
  isPublic: boolean,
  shareId: string | null
}
```

---

## Frontend Implementation

### Share Page Component

**File:** `src/app/share/[shareId]/page.tsx`

The share page is a public route that:
1. Fetches node data via API (`/api/share/[shareId]`)
2. Calculates SEO score client-side
3. Displays article with SEO analysis

Key features:
- Mobile-responsive layout (sidebar on top for mobile, right side for desktop)
- Dark mode toggle in header
- Full SEO score panel with expandable categories
- Article info section (word count, keyword, status, etc.)

```tsx
// Share page structure
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  {/* Header with theme toggle */}
  {/* Sidebar: SEO Score + Article Info */}
  {/* Main Content: Article */}
  {/* Footer */}
</div>
```

### Share Controls in Article Editor

**File:** `src/components/editor/article-editor.tsx`

The Share Article section in the editor sidebar includes:
- Toggle switch to enable/disable public sharing
- Copy-to-clipboard button for the share URL
- Status message indicating sharing state

```tsx
// State management
const [isPublic, setIsPublic] = useState(false);
const [shareId, setShareId] = useState<string | null>(null);

// Toggle function - uses API (Prisma)
const togglePublicShare = async () => {
  const response = await fetch(`/api/nodes/${nodeId}/share`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublic: newIsPublic }),
  });

  if (response.ok) {
    const { isPublic, shareId } = await response.json();
    setIsPublic(isPublic);
    setShareId(shareId);
  }
};
```

---

## SEO & Indexing

### Robots.txt Configuration

Share links are **excluded from search engine indexing** to:
- Prevent duplicate content issues
- Keep shared content private from search results
- Allow users to control what gets indexed

**File:** `src/app/robots.ts`

```typescript
disallow: [
  // ... other routes
  '/share/',  // Block all share pages from indexing
],
```

### Sitemap Exclusion

Share pages are NOT included in the sitemap since:
- They are dynamically generated per article
- They should not be discoverable via search engines
- Only direct link sharing is intended

---

## Rollback Scripts

### Complete Rollback

If you need to completely remove the shareable links feature:

```sql
-- =============================================
-- COMPLETE ROLLBACK: Public Share Feature
-- Run this if anything goes wrong
-- =============================================

-- 1. Remove the index
DROP INDEX IF EXISTS idx_nodes_share_id;

-- 2. Remove the columns
ALTER TABLE nodes DROP COLUMN IF EXISTS is_public;
ALTER TABLE nodes DROP COLUMN IF EXISTS share_id;
```

After running the SQL, update `prisma/schema.prisma` to remove:
- `is_public` field from nodes model
- `share_id` field from nodes model
- `@@index([share_id], map: "idx_nodes_share_id")` line

Then regenerate Prisma client:
```bash
npx prisma generate
```

### Partial Rollbacks

**Disable all public sharing (keep schema):**
```sql
UPDATE nodes SET is_public = false WHERE is_public = true;
```

---

## Files Modified/Created

| File | Type | Description |
|------|------|-------------|
| `src/app/share/[shareId]/page.tsx` | Modified | Uses API instead of direct Supabase |
| `src/app/api/share/[shareId]/route.ts` | New | Public API to fetch shared article (Prisma) |
| `src/app/api/nodes/[nodeId]/share/route.ts` | New | API to toggle/get share status (Prisma) |
| `src/components/editor/article-editor.tsx` | Modified | Uses API for share toggle |
| `src/app/robots.ts` | Modified | Added `/share/` to disallow |
| `prisma/schema.prisma` | Modified | Added `is_public`, `share_id` to nodes |

---

## Usage

### For Writers

1. Open an article in the editor
2. Find "Share Article" section at the top of the right sidebar
3. Toggle "Public sharing" to ON
4. Copy the generated link
5. Share with clients or collaborators

### For Viewers (Recipients)

1. Open the shared link
2. View article content and SEO analysis
3. Use theme toggle to switch between light/dark mode
4. Expand SEO categories to see detailed analysis

---

## Security Considerations

1. **UUID-based share IDs**: Share links use UUIDs, not predictable node IDs
2. **No write access**: Public viewers can only read, never modify
3. **Instant revocation**: Toggling off immediately disables the link
4. **Prisma bypasses RLS**: API routes use Prisma to avoid RLS issues while still verifying ownership
5. **No indexing**: Search engines cannot discover share links

---

## Migration Notes (Prisma)

This feature was migrated from direct Supabase client calls to Prisma ORM as part of the broader Prisma migration. Key changes:

- **Before**: Used `createClient()` from Supabase and direct `.from('nodes')` queries
- **After**: Uses API routes with Prisma for all database operations
- **Benefit**: Bypasses Supabase RLS policies, more predictable behavior for authenticated users

---

## Troubleshooting / Bug Fixes

### Bug: "Failed to toggle share status" (Jan 20, 2026)

**Symptom:** Clicking the share toggle in the article editor showed "Failed to toggle share status" in the console.

**Root Causes:**
1. The `is_public` and `share_id` columns were added to `prisma/schema.prisma` but not pushed to the actual database
2. Existing nodes had `NULL` for `share_id` because the column was newly added

**Solution:**
1. Ran `npx prisma db push` to sync schema changes to the database
2. Updated the API route to generate a new `share_id` when enabling sharing on nodes that don't have one:

```typescript
// In /api/nodes/[nodeId]/share/route.ts
const updateData: { is_public: boolean; share_id?: string } = { is_public: isPublic };
if (!node.share_id && isPublic) {
    updateData.share_id = crypto.randomUUID();
}
```

**Key Learnings:**
- Prisma schema changes (`schema.prisma`) don't automatically update the database
- Must run `npx prisma db push` or create migrations to apply schema changes
- Default values in Prisma schema only apply to new rows, not existing ones
- Need to handle `NULL` values for columns added to tables with existing data

---

*Last updated: January 2026*
