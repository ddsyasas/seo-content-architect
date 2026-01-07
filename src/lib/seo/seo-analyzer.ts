import { ArticleContent } from './seo-types';
import { SEO_CONFIG } from './seo-config';

export interface ContentAnalysis {
    wordCount: number;
    keywordCount: number;
    keywordDensity: number;
    keywordFirstPosition: number;
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
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find the word position of the first keyword occurrence
 */
function findKeywordPosition(words: string[], keyword: string): number {
    if (!keyword.trim()) return Infinity;

    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const text = words.map(w => w.toLowerCase());

    for (let i = 0; i <= text.length - keywordWords.length; i++) {
        const slice = text.slice(i, i + keywordWords.length);
        if (slice.join(' ') === keywordWords.join(' ')) {
            return i + 1; // 1-indexed position
        }
    }

    return Infinity; // Not found
}

/**
 * Analyze headings in the content
 */
function analyzeHeadings(html: string, keyword: string) {
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
    const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];

    const keywordLower = keyword.toLowerCase();

    const h1HasKeyword = h1Matches.some(h =>
        stripHtml(h).toLowerCase().includes(keywordLower)
    );
    const h2HasKeyword = h2Matches.some(h =>
        stripHtml(h).toLowerCase().includes(keywordLower)
    );

    // Check hierarchy (no H3 before H2, etc.)
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

/**
 * Analyze paragraphs in the content
 */
function analyzeParagraphs(html: string): Array<{ wordCount: number }> {
    const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];

    return paragraphs.map(p => {
        const text = stripHtml(p);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        return { wordCount: words.length };
    });
}

/**
 * Main function to analyze article content for SEO metrics
 */
export function analyzeContent(article: ArticleContent): ContentAnalysis {
    const plainText = stripHtml(article.content);
    const words = plainText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    const keyword = article.targetKeyword?.toLowerCase().trim() || '';

    // Keyword analysis
    let keywordCount = 0;
    let keywordDensity = 0;

    if (keyword) {
        const keywordRegex = new RegExp(escapeRegex(keyword), 'gi');
        const keywordMatches = plainText.match(keywordRegex) || [];
        keywordCount = keywordMatches.length;
        keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    }

    // Find first keyword position
    const keywordFirstPosition = findKeywordPosition(words, keyword);

    // Heading analysis
    const { h1Count, h2Count, h3Count, h1HasKeyword, h2HasKeyword, hierarchyValid } =
        analyzeHeadings(article.content, keyword);

    // Paragraph analysis
    const paragraphs = analyzeParagraphs(article.content);
    const longParagraphCount = paragraphs.filter(
        p => p.wordCount > SEO_CONFIG.readability.maxParagraphWords
    ).length;

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

/**
 * Extract images from HTML content
 * Uses a more robust approach to handle any attribute order
 */
export function extractImages(html: string): Array<{ src: string; alt: string }> {
    const images: Array<{ src: string; alt: string }> = [];

    // Find all img tags
    const imgTagRegex = /<img[^>]*>/gi;
    const imgTags = html.match(imgTagRegex) || [];

    for (const imgTag of imgTags) {
        // Extract src attribute  
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
        const src = srcMatch ? srcMatch[1] : '';

        // Extract alt attribute
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
        const alt = altMatch ? altMatch[1] : '';

        if (src) {
            images.push({ src, alt });
        }
    }

    return images;
}

/**
 * Extract internal links from HTML content
 */
export function extractInternalLinksForSEO(html: string, domain?: string): Array<{ href: string; anchor: string }> {
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    const links: Array<{ href: string; anchor: string }> = [];

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1] || '';
        const anchor = stripHtml(match[2] || '');

        // Check if internal (relative path or matches domain)
        const isInternal = href.startsWith('/') ||
            (domain && href.includes(domain)) ||
            (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:'));

        if (isInternal && href) {
            links.push({ href, anchor });
        }
    }

    return links;
}

/**
 * Extract outbound links from HTML content
 */
export function extractOutboundLinksForSEO(html: string, domain?: string): Array<{ href: string; anchor: string }> {
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    const links: Array<{ href: string; anchor: string }> = [];

    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1] || '';
        const anchor = stripHtml(match[2] || '');

        // Check if external
        const isExternal = (href.startsWith('http://') || href.startsWith('https://')) &&
            !(domain && href.includes(domain));

        if (isExternal && href) {
            links.push({ href, anchor });
        }
    }

    return links;
}
