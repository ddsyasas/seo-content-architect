# SEO Content Architect: Link Connection Guide

A visual guide explaining how content nodes connect via arrows, including direction, keywords, and link types.

---

## Content Hierarchy Overview

```
PILLAR PAGE (Top Level)
     │
     ▼
CLUSTER ARTICLE (Mid Level)
     │
     ▼
SUPPORTING ARTICLE (Bottom Level)
```

---

## Arrow Direction Rules

### Rule 1: Hierarchy Links (Internal Structure)

Every parent links DOWN to children. Every child links UP to parent.

```
┌─────────────────────────┐
│      PILLAR PAGE        │
│  "Ultimate Coffee Guide"│
└───────────┬─────────────┘
            │
            │ ━━━━━━━━━━━━━━━━━━━━━━━▶  (Arrow DOWN: Pillar links to Cluster)
            │   Keyword: "brewing methods"
            │
            │ ◀━━━━━━━━━━━━━━━━━━━━━━━  (Arrow UP: Cluster links back to Pillar)
            │   Keyword: "coffee guide"
            │
            ▼
┌─────────────────────────┐
│    CLUSTER ARTICLE      │
│  "Brewing Methods Guide"│
└───────────┬─────────────┘
            │
            │ ━━━━━━━━━━━━━━━━━━━━━━━▶  (Arrow DOWN: Cluster links to Supporting)
            │   Keyword: "french press"
            │
            │ ◀━━━━━━━━━━━━━━━━━━━━━━━  (Arrow UP: Supporting links back to Cluster)
            │   Keyword: "brewing methods"
            │
            ▼
┌─────────────────────────┐
│   SUPPORTING ARTICLE    │
│   "French Press Guide"  │
└─────────────────────────┘
```

**Key Point:** Two separate arrows exist between parent and child. Each arrow carries its own keyword (anchor text).

---

### Rule 2: Sibling Links (Same Level)

Articles at the same level can link to each other horizontally.

```
┌─────────────────────┐                    ┌─────────────────────┐
│  "French Press      │ ──────────────────▶│  "Pour Over         │
│   Guide"            │  Keyword:          │   Guide"            │
│                     │  "pour over coffee"│                     │
│                     │◀────────────────── │                     │
│                     │  Keyword:          │                     │
│                     │  "french press"    │                     │
└─────────────────────┘                    └─────────────────────┘
```

**Key Point:** Sibling links are optional. Use them when content is closely related.

---

### Rule 3: Cross-Cluster Links

Articles from different clusters can connect when contextually relevant.

```
CLUSTER: Brewing Methods              CLUSTER: Coffee Beans
          │                                     │
          ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│  "French Press      │ ╌╌╌╌╌╌╌╌╌╌╌▶│  "Best Beans for    │
│   Guide"            │  Keyword:    │   French Press"     │
│                     │  "beans for  │                     │
│                     │  french press"                     │
└─────────────────────┘              └─────────────────────┘
```

**Key Point:** Cross-cluster links use dashed arrows to visually distinguish them from hierarchy links.

---

## External Link Types

### Outbound Links (Your Site → External Site)

When your article links OUT to another website.

```
┌─────────────────────┐              ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                     │                   EXTERNAL SITE
│  "French Press      │ ·············▶    amazon.com       │
│   Guide"            │  Keyword:    │    (product page)
│                     │  "buy french  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
│                     │   press"
│                     │
│                     │ ·············▶┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                     │  Keyword:         EXTERNAL SITE
│                     │  "James       │   jameshoffman.com
└─────────────────────┘   Hoffmann"    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Visual Style:**
- Dotted line
- Gray color
- Arrow points OUTWARD (away from your content)
- External node has dashed border

---

### Backlinks (External Site → Your Site)

When another website links TO your article.

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐              ┌─────────────────────┐
     EXTERNAL SITE                  │                     │
│    reddit.com       │▪▪▪▪▪▪▪▪▪▪▪▪▶│  "French Press      │
     (r/coffee post)                │   Guide"            │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  Keyword:    │                     │
                        "this guide"│                     │
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐              │                     │
     EXTERNAL SITE    │             │                     │
│    coffeegeek.com   │▪▪▪▪▪▪▪▪▪▪▪▪▶│                     │
     (forum mention)                │                     │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  Keyword:    └─────────────────────┘
                        "french press
                         tutorial"
```

**Visual Style:**
- Dotted line
- Green color (indicates positive authority signal)
- Arrow points INWARD (toward your content)
- External node has dashed border

---

## Arrow Style Summary

| Link Type | Arrow Style | Color | Direction | Shows Keyword |
|-----------|-------------|-------|-----------|---------------|
| Hierarchy Down | Solid thick | Blue | Parent → Child | Yes |
| Hierarchy Up | Solid thick | Blue | Child → Parent | Yes |
| Sibling | Solid thin | Light Blue | Article ↔ Article | Yes |
| Cross-Cluster | Dashed | Purple | Article → Article | Yes |
| Outbound | Dotted | Gray | Your Article → External | Yes |
| Backlink | Dotted | Green | External → Your Article | Yes |

---

## Complete Example: One Article's Connections

```
                    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                         BACKLINK
                    │   reddit.com     │
                     ─ ─ ─ ─ ─┬─ ─ ─ ─
                              │
                              ▪ "best guide"
                              ▪
                              ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│  PILLAR         │    │                     │    │  SIBLING        │
│  "Coffee Guide" │◀━━━│  "French Press      │───▶│  "Pour Over     │
│                 │    │   Guide"            │    │   Guide"        │
│                 │━━━▶│   (MAIN ARTICLE)    │◀───│                 │
└─────────────────┘    │                     │    └─────────────────┘
  "coffee guide"       │                     │      "pour over"
  "french press"       │                     │      "french press"
                       │                     │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌ ─ ─ ─ ─ ─ ─ ┐
              │SUPPORTING│  │ CROSS-   │     OUTBOUND
              │"Best     │  │ CLUSTER  │  │  amazon.com  │
              │ Grind    │  │"Beans for│      (product)
              │ Size"    │  │ French   │  └ ─ ─ ─ ─ ─ ─ ┘
              └──────────┘  │ Press"   │   "buy french
               "grind size" └──────────┘    press"
               "french       "best beans"
                press"
```

---

## Arrow Labels (Keywords)

Every arrow MUST display the keyword/anchor text used in the link.

**Why this matters:**
- SEO value comes from the anchor text
- Helps identify over-optimized anchors (too many exact match)
- Shows the semantic relationship between content

**Display Options:**

Option A: Label on the arrow line
```
Article A ────["anchor text"]────▶ Article B
```

Option B: Label near the arrow (when space is tight)
```
Article A ─────────────────────▶ Article B
              "anchor text"
```

---

## Node Visual Differentiation

| Node Type | Shape | Border | Size |
|-----------|-------|--------|------|
| Pillar | Rectangle | Thick solid | Large |
| Cluster | Rectangle | Medium solid | Medium |
| Supporting | Rectangle | Thin solid | Regular |
| External (Outbound) | Rectangle | Dashed gray | Small |
| External (Backlink) | Rectangle | Dashed green | Small |

---

## Interaction Requirements

1. **Creating a connection:**
   - User drags from source node handle to target node handle
   - Prompt appears asking for: Link Type + Keyword
   - Arrow renders with keyword label

2. **Editing a connection:**
   - User clicks on arrow
   - Can edit keyword or delete connection

3. **Viewing connections:**
   - Hover on node highlights all its connections
   - Click on node shows connection list in sidebar

---

## Quick Reference: Which Arrow to Use

| From | To | Arrow Type |
|------|----|------------|
| Pillar | Cluster | Hierarchy Down (solid) |
| Cluster | Pillar | Hierarchy Up (solid) |
| Cluster | Supporting | Hierarchy Down (solid) |
| Supporting | Cluster | Hierarchy Up (solid) |
| Supporting | Supporting (same cluster) | Sibling (solid thin) |
| Article | Article (different cluster) | Cross-Cluster (dashed) |
| Your Article | External Website | Outbound (dotted gray) |
| External Website | Your Article | Backlink (dotted green) |

---

## Key Principles

1. **Every arrow has a direction** (source → target)
2. **Every arrow has a keyword** (the anchor text)
3. **Internal links are solid lines** (your content)
4. **External links are dotted lines** (other websites)
5. **Backlinks are green** (authority coming IN)
6. **Outbound links are gray** (authority going OUT)
7. **Hierarchy uses thick arrows** (main structure)
8. **Sibling/cross-cluster uses thin arrows** (secondary connections)

---

End of Guide
