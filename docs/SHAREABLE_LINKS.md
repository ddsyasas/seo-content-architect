# Shareable Links Implementation

This document describes the public shareable links feature in SyncSEO, including database schema, API implementation, UI components, and SEO considerations.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [RLS Policies](#rls-policies)
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

## RLS Policies

### Policy for `nodes` Table

Allows public read access to nodes that have `is_public = true`:

```sql
CREATE POLICY "Allow public read access for shared articles"
ON nodes
FOR SELECT
USING (is_public = true);
```

### Policy for `articles` Table

Allows public read access to article content when the related node is public:

```sql
CREATE POLICY "Allow public read access for shared articles content"
ON articles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM nodes
        WHERE nodes.id = articles.node_id
        AND nodes.is_public = true
    )
);
```

---

## Frontend Implementation

### Share Page Component

**File:** `src/app/share/[shareId]/page.tsx`

The share page is a public route that:
1. Fetches node data by `share_id` (only if `is_public = true`)
2. Fetches related article content
3. Calculates SEO score client-side
4. Displays article with SEO analysis

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

// Toggle function
const togglePublicShare = async () => {
  const newIsPublic = !isPublic;
  setIsPublic(newIsPublic);

  const supabase = createClient();
  await supabase
    .from('nodes')
    .update({ is_public: newIsPublic })
    .eq('id', nodeId);
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

-- 1. Remove RLS policies
DROP POLICY IF EXISTS "Allow public read access for shared articles" ON nodes;
DROP POLICY IF EXISTS "Allow public read access for shared articles content" ON articles;

-- 2. Remove the index
DROP INDEX IF EXISTS idx_nodes_share_id;

-- 3. Remove the columns
ALTER TABLE nodes DROP COLUMN IF EXISTS is_public;
ALTER TABLE nodes DROP COLUMN IF EXISTS share_id;
```

### Partial Rollbacks

**Remove only the nodes RLS policy:**
```sql
DROP POLICY IF EXISTS "Allow public read access for shared articles" ON nodes;
```

**Remove only the articles RLS policy:**
```sql
DROP POLICY IF EXISTS "Allow public read access for shared articles content" ON articles;
```

**Disable all public sharing (keep schema):**
```sql
UPDATE nodes SET is_public = false WHERE is_public = true;
```

---

## Files Modified/Created

| File | Type | Description |
|------|------|-------------|
| `src/app/share/[shareId]/page.tsx` | New | Public share page component |
| `src/components/editor/article-editor.tsx` | Modified | Added share toggle UI |
| `src/app/robots.ts` | Modified | Added `/share/` to disallow |
| Database | Modified | Added `is_public`, `share_id` columns to `nodes` |
| Database | Modified | Added RLS policies for public access |

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
4. **RLS enforced**: Database policies ensure only public articles are accessible
5. **No indexing**: Search engines cannot discover share links

---

*Last updated: January 2026*
