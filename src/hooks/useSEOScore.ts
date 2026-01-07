import { useState, useEffect } from 'react';
import { calculateSEOScore } from '@/lib/seo/seo-calculator';
import { SEOScoreResult, ArticleContent } from '@/lib/seo/seo-types';
import { SEO_CONFIG } from '@/lib/seo/seo-config';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Hook for real-time SEO score calculation with debouncing
 */
export function useSEOScore(article: ArticleContent): SEOScoreResult | null {
    const [score, setScore] = useState<SEOScoreResult | null>(null);

    // Debounce the article content to avoid excessive calculations
    const debouncedArticle = useDebouncedValue(article, SEO_CONFIG.ui.debounceMs);

    useEffect(() => {
        // Only calculate if we have a target keyword
        if (!debouncedArticle.targetKeyword?.trim()) {
            setScore(null);
            return;
        }

        const result = calculateSEOScore(debouncedArticle);
        setScore(result);
    }, [
        debouncedArticle.content,
        debouncedArticle.targetKeyword,
        debouncedArticle.seoTitle,
        debouncedArticle.seoDescription,
        debouncedArticle.title,
        debouncedArticle.images?.length,
        debouncedArticle.internalLinks?.length,
        debouncedArticle.outboundLinks?.length,
    ]);

    return score;
}
