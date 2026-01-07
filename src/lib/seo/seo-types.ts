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
    content: string;
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
