# SEO Score Panel - Implementation Specification

## Overview

This document provides implementation details for adding an SEO Score panel to the existing Article Editor interface. The implementation must preserve all existing functionality while adding a new collapsible section to the right sidebar.

**Critical Requirements:**
1. Do NOT modify existing Article Settings functionality
2. Keep SEO algorithm in a separate, editable configuration file
3. Make the SEO panel collapsible and non-intrusive
4. All calculations should be real-time (debounced)

---

## Current UI Structure (Do Not Modify)

The existing right sidebar contains:

```
Article Settings
├── URL Preview (domain1.com/article-02)
├── Slug (article-02) [Auto button]
├── Target Keyword (input field)
├── Content Type (Pillar | Cluster | Supporting | Planned)
├── Status (Planned | Writing | Published | Needs Update)
└── SEO Settings
    ├── SEO Title (input, 0/60 characters)
    └── SEO Description (textarea, 0/160 characters)
```

**Existing elements to preserve:**
- URL Preview
- Slug with Auto button
- Target Keyword input
- Content Type selector (4 options)
- Status selector (4 options)
- SEO Title input with character counter
- SEO Description textarea with character counter

---

## New Section: SEO Score Panel

Add a new collapsible section BELOW the existing "SEO Settings" section.

### Proposed UI Layout

```
Article Settings
├── [Existing sections - DO NOT MODIFY]
│   ├── URL Preview
│   ├── Slug
│   ├── Target Keyword
│   ├── Content Type
│   ├── Status
│   └── SEO Settings
│       ├── SEO Title
│       └── SEO Description
│
└── [NEW] SEO Score (collapsible)
    ├── Score Gauge (0-100)
    ├── Category Indicators (collapsible subsections)
    │   ├── Target Keyword
    │   ├── Meta Elements
    │   ├── Content Structure
    │   ├── Readability
    │   ├── Internal Links
    │   ├── Images
    │   └── Outbound Links
    └── [Optional] "Refresh" button
```

---

## Visual Design Specification

### SEO Score Header (Collapsed State)

```
┌─────────────────────────────────────────┐
│  ▶ SEO Score                    78/100  │
│    ████████████████░░░░  Good           │
└─────────────────────────────────────────┘
```

### SEO Score Header (Expanded State)

```
┌─────────────────────────────────────────┐
│  ▼ SEO Score                    78/100  │
│                                         │
│         ╭─────────────────╮             │
│        ╱   ╲       ╱   ╲   ╲            │
│       ╱     ╲     ╱     ╲   ╲           │
│      │       ╲   ╱       │   │          │
│      │   78   ╲ ╱        │              │
│       ╲       ╱ ╲       ╱               │
│        ╲_____╱   ╲_____╱                │
│            Good                         │
│                                         │
│  ▼ Target Keyword              23/25    │
│    ● Density: 1.2% (good)               │
│    ● In first paragraph                 │
│    ● In H1 heading                      │
│                                         │
│  ▶ Meta Elements               18/20    │
│  ▶ Content Structure           17/20    │
│  ▶ Readability                  8/10    │
│  ▶ Internal Links               7/10    │
│  ▶ Images                       4/10    │
│  ▶ Outbound Links               5/5     │
└─────────────────────────────────────────┘
```

### Indicator Icons

Use colored circles for traffic light indicators:

```
● Green  (#10B981) - Pass
◐ Orange (#F59E0B) - Could improve  
○ Red    (#EF4444) - Needs fixing
```

---

## File Structure

Create these new files without modifying existing ones:

```
src/
├── lib/
│   └── seo/
│       ├── seo-config.ts        # Algorithm configuration (EDITABLE)
│       ├── seo-calculator.ts    # Score calculation logic
│       ├── seo-analyzer.ts      # Content analysis functions
│       └── seo-types.ts         # TypeScript types
│
├── components/
│   └── editor/
│       └── seo-panel/
│           ├── SEOScorePanel.tsx       # Main panel component
│           ├── SEOScoreGauge.tsx       # Gauge visualization
│           ├── SEOCategorySection.tsx  # Collapsible category
│           ├── SEOIndicator.tsx        # Single indicator item
│           └── index.ts                # Exports
│
└── hooks/
    └── useSEOScore.ts           # Hook for real-time calculation
```

---

## SEO Configuration File (CRITICAL - Must Be Separate)

This file contains all algorithm parameters. It must be easily editable for future improvements without touching other code.

### File: `src/lib/seo/seo-config.ts`

```typescript
/**
 * SEO SCORING ALGORITHM CONFIGURATION
 * 
 * This file contains all configurable parameters for the SEO scoring system.
 * Modify values here to adjust scoring without changing application logic.
 * 
 * Last Updated: [DATE]
 * Version: 1.0
 */

export const SEO_CONFIG = {
  // ============================================
  // CATEGORY WEIGHTS (must sum to 100)
  // ============================================
  weights: {
    targetKeyword: 25,
    metaElements: 20,
    contentStructure: 20,
    readability: 10,
    internalLinks: 10,
    images: 10,
    outboundLinks: 5,
  },

  // ============================================
  // SCORE ZONES
  // ============================================
  scoreZones: {
    poor: { min: 0, max: 40, label: 'Poor', color: '#EF4444' },
    needsWork: { min: 41, max: 60, label: 'Needs Work', color: '#F59E0B' },
    good: { min: 61, max: 80, label: 'Good', color: '#84CC16' },
    excellent: { min: 81, max: 100, label: 'Excellent', color: '#10B981' },
  },

  // ============================================
  // TARGET KEYWORD SETTINGS
  // ============================================
  targetKeyword: {
    density: {
      optimal: { min: 0.8, max: 2.0 },      // Green zone
      acceptable: { min: 0.5, max: 2.5 },   // Orange zone
      // Outside acceptable = Red
    },
    firstParagraph: {
      optimal: 100,      // Words - Green if within
      acceptable: 150,   // Words - Orange if within
    },
    stuffingThreshold: 2.5,  // Percentage - Red if exceeded
    
    // Points allocation
    points: {
      density: 10,
      firstParagraph: 8,
      noStuffing: 7,
    },
  },

  // ============================================
  // META ELEMENTS SETTINGS
  // ============================================
  metaElements: {
    title: {
      length: {
        optimal: { min: 50, max: 60 },
        acceptable: { min: 40, max: 65 },
      },
      keywordPositionBonus: 30,  // Characters - bonus if keyword within
      points: {
        length: 4,
        hasKeyword: 4,
        keywordPosition: 2,
      },
    },
    description: {
      length: {
        optimal: { min: 150, max: 160 },
        acceptable: { min: 120, max: 170 },
      },
      points: {
        length: 5,
        hasKeyword: 5,
      },
    },
  },

  // ============================================
  // CONTENT STRUCTURE SETTINGS
  // ============================================
  contentStructure: {
    h1: {
      requiredCount: 1,  // Exactly one H1
    },
    h2: {
      wordsPerHeading: 250,  // One H2 every X words
      ratioThresholds: {
        good: 0.9,    // 90%+ of target
        okay: 0.6,    // 60%+ of target
      },
    },
    points: {
      singleH1: 5,
      h1HasKeyword: 5,
      h2HasKeyword: 4,
      properHierarchy: 3,
      h2Frequency: 3,
    },
  },

  // ============================================
  // READABILITY SETTINGS
  // ============================================
  readability: {
    maxParagraphWords: 300,
    points: {
      total: 10,
    },
  },

  // ============================================
  // INTERNAL LINKS SETTINGS
  // ============================================
  internalLinks: {
    linksPerThousandWords: 3,  // Target ratio
    thresholds: {
      excellent: 1.0,   // 100%+ of target
      good: 0.75,       // 75%+ of target
      okay: 0.50,       // 50%+ of target
      poor: 0.25,       // 25%+ of target
    },
    points: {
      excellent: 10,
      good: 7,
      okay: 4,
      poor: 2,
      none: 0,
    },
  },

  // ============================================
  // IMAGES SETTINGS
  // ============================================
  images: {
    wordsPerImage: 400,  // One image every X words
    thresholds: {
      good: 1.0,    // 100%+ of target
      okay: 0.5,    // 50%+ of target
    },
    points: {
      baseGood: 7,
      baseOkay: 4,
      basePoor: 0,
      allHaveAlt: 2,
      altHasKeyword: 1,
    },
  },

  // ============================================
  // OUTBOUND LINKS SETTINGS
  // ============================================
  outboundLinks: {
    optimal: { min: 1, max: 5 },
    points: {
      optimal: 5,
      excessive: 3,  // More than 5
      none: 0,
    },
  },

  // ============================================
  // UI SETTINGS
  // ============================================
  ui: {
    debounceMs: 1000,  // Delay before recalculating
    defaultExpanded: false,  // Panel collapsed by default
    showPointsBreakdown: true,  // Show "23/25" next to categories
  },
};

// Type export for TypeScript
export type SEOConfig = typeof SEO_CONFIG;
```

---

## TypeScript Types

### File: `src/lib/seo/seo-types.ts`

```typescript
export type IndicatorStatus = 'good' | 'okay' | 'poor';

export interface SEOIndicator {
  id: string;
  message: string;
  status: IndicatorStatus;
  points: number;
  maxPoints: number;
}

export interface SEOCategory {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  indicators: SEOIndicator[];
}

export interface SEOScoreResult {
  totalScore: number;
  maxScore: number;
  zone: 'poor' | 'needsWork' | 'good' | 'excellent';
  zoneLabel: string;
  zoneColor: string;
  categories: {
    targetKeyword: SEOCategory;
    metaElements: SEOCategory;
    contentStructure: SEOCategory;
    readability: SEOCategory;
    internalLinks: SEOCategory;
    images: SEOCategory;
    outboundLinks: SEOCategory;
  };
}

export interface ArticleContent {
  title: string;
  content: string;  // HTML or plain text from editor
  seoTitle: string;
  seoDescription: string;
  targetKeyword: string;
  slug: string;
  images: Array<{
    src: string;
    alt: string;
  }>;
  internalLinks: Array<{
    href: string;
    anchor: string;
  }>;
  outboundLinks: Array<{
    href: string;
    anchor: string;
  }>;
}
```

---

## Score Calculator

### File: `src/lib/seo/seo-calculator.ts`

```typescript
import { SEO_CONFIG } from './seo-config';
import { SEOScoreResult, ArticleContent, SEOCategory, SEOIndicator } from './seo-types';
import { analyzeContent } from './seo-analyzer';

/**
 * Main function to calculate SEO score
 * This function uses the configuration from seo-config.ts
 */
export function calculateSEOScore(article: ArticleContent): SEOScoreResult {
  const analysis = analyzeContent(article);
  
  // Calculate each category
  const targetKeyword = calculateTargetKeywordScore(article, analysis);
  const metaElements = calculateMetaElementsScore(article, analysis);
  const contentStructure = calculateContentStructureScore(article, analysis);
  const readability = calculateReadabilityScore(article, analysis);
  const internalLinks = calculateInternalLinksScore(article, analysis);
  const images = calculateImagesScore(article, analysis);
  const outboundLinks = calculateOutboundLinksScore(article, analysis);
  
  // Sum total score
  const totalScore = 
    targetKeyword.score +
    metaElements.score +
    contentStructure.score +
    readability.score +
    internalLinks.score +
    images.score +
    outboundLinks.score;
  
  // Determine zone
  const zone = getScoreZone(totalScore);
  
  return {
    totalScore,
    maxScore: 100,
    zone: zone.key,
    zoneLabel: zone.label,
    zoneColor: zone.color,
    categories: {
      targetKeyword,
      metaElements,
      contentStructure,
      readability,
      internalLinks,
      images,
      outboundLinks,
    },
  };
}

function getScoreZone(score: number) {
  const { scoreZones } = SEO_CONFIG;
  
  if (score <= scoreZones.poor.max) {
    return { key: 'poor' as const, ...scoreZones.poor };
  }
  if (score <= scoreZones.needsWork.max) {
    return { key: 'needsWork' as const, ...scoreZones.needsWork };
  }
  if (score <= scoreZones.good.max) {
    return { key: 'good' as const, ...scoreZones.good };
  }
  return { key: 'excellent' as const, ...scoreZones.excellent };
}

// Individual category calculation functions...
// (Implementation details for each category)

function calculateTargetKeywordScore(article: ArticleContent, analysis: any): SEOCategory {
  const config = SEO_CONFIG.targetKeyword;
  const indicators: SEOIndicator[] = [];
  let totalPoints = 0;
  
  // Density check
  const density = analysis.keywordDensity;
  let densityStatus: 'good' | 'okay' | 'poor';
  let densityPoints = 0;
  let densityMessage = '';
  
  if (density >= config.density.optimal.min && density <= config.density.optimal.max) {
    densityStatus = 'good';
    densityPoints = config.points.density;
    densityMessage = `Keyword density is ${density.toFixed(1)}% (good)`;
  } else if (density >= config.density.acceptable.min && density <= config.density.acceptable.max) {
    densityStatus = 'okay';
    densityPoints = config.points.density / 2;
    densityMessage = `Keyword density is ${density.toFixed(1)}% (could be improved)`;
  } else {
    densityStatus = 'poor';
    densityPoints = 0;
    if (density < config.density.acceptable.min) {
      densityMessage = `Keyword density is ${density.toFixed(1)}% (add more keyword mentions)`;
    } else {
      densityMessage = `Keyword density is ${density.toFixed(1)}% (reduce to avoid over-optimization)`;
    }
  }
  
  indicators.push({
    id: 'keyword-density',
    message: densityMessage,
    status: densityStatus,
    points: densityPoints,
    maxPoints: config.points.density,
  });
  totalPoints += densityPoints;
  
  // First paragraph check
  const firstParaPosition = analysis.keywordFirstPosition;
  let firstParaStatus: 'good' | 'okay' | 'poor';
  let firstParaPoints = 0;
  let firstParaMessage = '';
  
  if (firstParaPosition <= config.firstParagraph.optimal) {
    firstParaStatus = 'good';
    firstParaPoints = config.points.firstParagraph;
    firstParaMessage = 'Keyword appears in first paragraph';
  } else if (firstParaPosition <= config.firstParagraph.acceptable) {
    firstParaStatus = 'okay';
    firstParaPoints = config.points.firstParagraph / 2;
    firstParaMessage = 'Keyword appears early, but consider moving to first paragraph';
  } else {
    firstParaStatus = 'poor';
    firstParaPoints = 0;
    firstParaMessage = 'Add your keyword to the introduction';
  }
  
  indicators.push({
    id: 'keyword-first-para',
    message: firstParaMessage,
    status: firstParaStatus,
    points: firstParaPoints,
    maxPoints: config.points.firstParagraph,
  });
  totalPoints += firstParaPoints;
  
  // Stuffing check
  const stuffingStatus = density <= config.stuffingThreshold ? 'good' : 'poor';
  const stuffingPoints = stuffingStatus === 'good' ? config.points.noStuffing : 0;
  
  indicators.push({
    id: 'keyword-stuffing',
    message: stuffingStatus === 'good' 
      ? 'No keyword stuffing detected'
      : 'Keyword stuffing detected - reduce usage',
    status: stuffingStatus,
    points: stuffingPoints,
    maxPoints: config.points.noStuffing,
  });
  totalPoints += stuffingPoints;
  
  return {
    id: 'targetKeyword',
    name: 'Target Keyword',
    score: totalPoints,
    maxScore: SEO_CONFIG.weights.targetKeyword,
    indicators,
  };
}

// Similar implementations for other categories...
// calculateMetaElementsScore()
// calculateContentStructureScore()
// calculateReadabilityScore()
// calculateInternalLinksScore()
// calculateImagesScore()
// calculateOutboundLinksScore()

export { calculateTargetKeywordScore };
```

---

## Content Analyzer

### File: `src/lib/seo/seo-analyzer.ts`

```typescript
import { ArticleContent } from './seo-types';

export interface ContentAnalysis {
  wordCount: number;
  keywordCount: number;
  keywordDensity: number;
  keywordFirstPosition: number;  // Word position of first keyword occurrence
  keywordInH1: boolean;
  keywordInH2: boolean;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  headingHierarchyValid: boolean;
  paragraphs: Array<{ wordCount: number }>;
  longParagraphCount: number;
}

/**
 * Analyze article content for SEO metrics
 */
export function analyzeContent(article: ArticleContent): ContentAnalysis {
  const plainText = stripHtml(article.content);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  const keyword = article.targetKeyword.toLowerCase().trim();
  const keywordRegex = new RegExp(escapeRegex(keyword), 'gi');
  
  // Keyword analysis
  const keywordMatches = plainText.match(keywordRegex) || [];
  const keywordCount = keywordMatches.length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  
  // Find first keyword position
  const keywordFirstPosition = findKeywordPosition(words, keyword);
  
  // Heading analysis
  const { h1Count, h2Count, h3Count, h1HasKeyword, h2HasKeyword, hierarchyValid } = 
    analyzeHeadings(article.content, keyword);
  
  // Paragraph analysis
  const paragraphs = analyzeParagraphs(article.content);
  const longParagraphCount = paragraphs.filter(p => p.wordCount > 300).length;
  
  return {
    wordCount,
    keywordCount,
    keywordDensity,
    keywordFirstPosition,
    keywordInH1: h1HasKeyword,
    keywordInH2: h2HasKeyword,
    h1Count,
    h2Count,
    h3Count,
    headingHierarchyValid: hierarchyValid,
    paragraphs,
    longParagraphCount,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findKeywordPosition(words: string[], keyword: string): number {
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  const text = words.map(w => w.toLowerCase());
  
  for (let i = 0; i <= text.length - keywordWords.length; i++) {
    const slice = text.slice(i, i + keywordWords.length);
    if (slice.join(' ') === keywordWords.join(' ')) {
      return i + 1;  // 1-indexed position
    }
  }
  
  return Infinity;  // Not found
}

function analyzeHeadings(html: string, keyword: string) {
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
  
  const h1HasKeyword = h1Matches.some(h => 
    stripHtml(h).toLowerCase().includes(keyword.toLowerCase())
  );
  const h2HasKeyword = h2Matches.some(h => 
    stripHtml(h).toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Check hierarchy (simplified - no H3 before H2, etc.)
  const headingOrder = [...html.matchAll(/<(h[1-6])[^>]*>/gi)]
    .map(m => parseInt(m[1].charAt(1)));
  
  let hierarchyValid = true;
  let lastLevel = 0;
  for (const level of headingOrder) {
    if (level > lastLevel + 1 && lastLevel !== 0) {
      hierarchyValid = false;
      break;
    }
    lastLevel = level;
  }
  
  return {
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h1HasKeyword,
    h2HasKeyword,
    hierarchyValid,
  };
}

function analyzeParagraphs(html: string): Array<{ wordCount: number }> {
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  
  return paragraphs.map(p => {
    const text = stripHtml(p);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return { wordCount: words.length };
  });
}
```

---

## React Hook

### File: `src/hooks/useSEOScore.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { calculateSEOScore } from '@/lib/seo/seo-calculator';
import { SEOScoreResult, ArticleContent } from '@/lib/seo/seo-types';
import { SEO_CONFIG } from '@/lib/seo/seo-config';
import { useDebouncedValue } from './useDebouncedValue';  // Existing or create

export function useSEOScore(article: ArticleContent): SEOScoreResult | null {
  const [score, setScore] = useState<SEOScoreResult | null>(null);
  
  // Debounce the article content to avoid excessive calculations
  const debouncedArticle = useDebouncedValue(article, SEO_CONFIG.ui.debounceMs);
  
  useEffect(() => {
    if (!debouncedArticle.targetKeyword) {
      setScore(null);
      return;
    }
    
    const result = calculateSEOScore(debouncedArticle);
    setScore(result);
  }, [debouncedArticle]);
  
  return score;
}
```

---

## React Components

### File: `src/components/editor/seo-panel/SEOScorePanel.tsx`

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SEOScoreResult } from '@/lib/seo/seo-types';
import { SEO_CONFIG } from '@/lib/seo/seo-config';
import { SEOScoreGauge } from './SEOScoreGauge';
import { SEOCategorySection } from './SEOCategorySection';

interface SEOScorePanelProps {
  score: SEOScoreResult | null;
  isLoading?: boolean;
}

export function SEOScorePanel({ score, isLoading }: SEOScorePanelProps) {
  const [isExpanded, setIsExpanded] = useState(SEO_CONFIG.ui.defaultExpanded);
  
  if (!score) {
    return (
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="text-sm text-gray-500">
          Enter a target keyword to see SEO analysis
        </div>
      </div>
    );
  }
  
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-semibold text-gray-900">SEO Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-lg font-bold"
            style={{ color: score.zoneColor }}
          >
            {score.totalScore}/100
          </span>
        </div>
      </button>
      
      {/* Mini progress bar - Always Visible */}
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${score.totalScore}%`,
            backgroundColor: score.zoneColor 
          }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500 text-right">
        {score.zoneLabel}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {/* Gauge */}
          <SEOScoreGauge score={score.totalScore} color={score.zoneColor} />
          
          {/* Categories */}
          <div className="mt-4 space-y-1">
            <SEOCategorySection category={score.categories.targetKeyword} />
            <SEOCategorySection category={score.categories.metaElements} />
            <SEOCategorySection category={score.categories.contentStructure} />
            <SEOCategorySection category={score.categories.readability} />
            <SEOCategorySection category={score.categories.internalLinks} />
            <SEOCategorySection category={score.categories.images} />
            <SEOCategorySection category={score.categories.outboundLinks} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/editor/seo-panel/SEOCategorySection.tsx`

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SEOCategory } from '@/lib/seo/seo-types';
import { SEOIndicator } from './SEOIndicator';

interface SEOCategorySectionProps {
  category: SEOCategory;
}

export function SEOCategorySection({ category }: SEOCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasIssues = category.indicators.some(i => i.status !== 'good');
  
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {category.name}
          </span>
          {hasIssues && (
            <span className="w-2 h-2 rounded-full bg-orange-400" />
          )}
        </div>
        <span className="text-xs text-gray-500">
          {category.score}/{category.maxScore}
        </span>
      </button>
      
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {category.indicators.map(indicator => (
            <SEOIndicator key={indicator.id} indicator={indicator} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### File: `src/components/editor/seo-panel/SEOIndicator.tsx`

```tsx
import { SEOIndicator as SEOIndicatorType } from '@/lib/seo/seo-types';

const statusColors = {
  good: '#10B981',   // Green
  okay: '#F59E0B',   // Orange
  poor: '#EF4444',   // Red
};

interface SEOIndicatorProps {
  indicator: SEOIndicatorType;
}

export function SEOIndicator({ indicator }: SEOIndicatorProps) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span 
        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColors[indicator.status] }}
      />
      <span className="text-xs text-gray-600">
        {indicator.message}
      </span>
    </div>
  );
}
```

---

## Integration with Existing Editor

Add the SEO panel to the existing sidebar WITHOUT modifying other components:

### In your existing editor sidebar file:

```tsx
// Import the new component
import { SEOScorePanel } from '@/components/editor/seo-panel';
import { useSEOScore } from '@/hooks/useSEOScore';

// Inside your component, after existing Article Settings:
function EditorSidebar({ article, ...props }) {
  // Create article content object for SEO analysis
  const articleContent = useMemo(() => ({
    title: article.title,
    content: article.content,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    targetKeyword: article.targetKeyword,
    slug: article.slug,
    images: extractImages(article.content),
    internalLinks: extractInternalLinks(article.content),
    outboundLinks: extractOutboundLinks(article.content),
  }), [article]);
  
  const seoScore = useSEOScore(articleContent);
  
  return (
    <div className="...existing classes...">
      {/* EXISTING: Article Settings section */}
      <div className="...">
        {/* URL Preview, Slug, Target Keyword, etc. */}
        {/* DO NOT MODIFY EXISTING CODE */}
      </div>
      
      {/* EXISTING: SEO Settings section */}
      <div className="...">
        {/* SEO Title, SEO Description */}
        {/* DO NOT MODIFY EXISTING CODE */}
      </div>
      
      {/* NEW: SEO Score Panel - ADD THIS */}
      <SEOScorePanel score={seoScore} />
    </div>
  );
}
```

---

## Important Implementation Notes

### 1. Algorithm Separation

The algorithm configuration is intentionally kept in `seo-config.ts` so that:
- Future improvements can be made by only editing this file
- A/B testing different scoring weights is possible
- Non-developers can understand and suggest changes

### 2. Backward Compatibility

- All new files are in separate directories
- No modifications to existing components
- The SEO panel is additive, not replacing anything

### 3. Performance

- Debounce calculations to avoid lag while typing
- Only calculate when target keyword is provided
- Memoize expensive operations

### 4. Future Extensibility

To add new checks in the future:
1. Add configuration to `seo-config.ts`
2. Add analysis logic to `seo-analyzer.ts`
3. Add scoring logic to `seo-calculator.ts`
4. Update types in `seo-types.ts`

No changes to UI components needed for most additions.

---

## Testing Checklist

Before deployment, verify:

- [ ] Existing Article Settings work unchanged
- [ ] SEO panel appears below SEO Settings
- [ ] Panel collapses/expands correctly
- [ ] Score updates when content changes (with debounce)
- [ ] All indicator colors display correctly
- [ ] Score calculation matches expected values
- [ ] No target keyword = panel shows placeholder message
- [ ] Performance is acceptable with large articles

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [DATE] | Initial implementation |

---

End of Specification
