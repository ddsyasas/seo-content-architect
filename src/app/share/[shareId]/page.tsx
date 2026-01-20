'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Target, Globe, Calendar, User, Link2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { calculateSEOScore } from '@/lib/seo/seo-calculator';
import { extractImages, extractInternalLinksForSEO, extractOutboundLinksForSEO } from '@/lib/seo/seo-analyzer';
import { SEOScoreResult, ArticleContent } from '@/lib/seo/seo-types';
import { SEOScoreGauge } from '@/components/editor/seo-panel/SEOScoreGauge';
import { SEOCategorySection } from '@/components/editor/seo-panel/SEOCategorySection';

interface SharedArticleData {
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

interface SharePageProps {
    params: Promise<{ shareId: string }>;
}

export default function SharePage({ params }: SharePageProps) {
    const [data, setData] = useState<SharedArticleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSharedArticle = async () => {
            const { shareId } = await params;

            try {
                // Fetch shared article data from API (uses Prisma, no RLS issues)
                const response = await fetch(`/api/share/${shareId}`);

                if (!response.ok) {
                    setError('Article not found or is no longer public');
                    setIsLoading(false);
                    return;
                }

                const { node, article, project } = await response.json();

                setData({
                    node,
                    article,
                    project,
                });
            } catch (err) {
                console.error('Failed to load shared article:', err);
                setError('Failed to load article');
            }

            setIsLoading(false);
        };

        loadSharedArticle();
    }, [params]);

    // Calculate SEO score - must be before any early returns (Rules of Hooks)
    const seoScore: SEOScoreResult | null = useMemo(() => {
        if (!data) return null;
        const { node, article, project } = data;
        if (!article?.content || !node.target_keyword) return null;

        const articleContent: ArticleContent = {
            title: node.title,
            content: article.content,
            seoTitle: article.seo_title || '',
            seoDescription: article.seo_description || '',
            targetKeyword: node.target_keyword || '',
            slug: node.slug || '',
            images: extractImages(article.content),
            internalLinks: extractInternalLinksForSEO(article.content, project?.domain || undefined),
            outboundLinks: extractOutboundLinksForSEO(article.content, project?.domain || undefined),
        };

        return calculateSEOScore(articleContent);
    }, [data]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Article Not Found</h1>
                    <p className="text-gray-500 dark:text-gray-400">This article doesn't exist or is no longer public.</p>
                </div>
            </div>
        );
    }

    const { node, article, project } = data;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                                Shared Article
                            </span>
                            {project && <span>from {project.name}</span>}
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Main Content */}
                    <div className="flex-1 order-2 lg:order-1">
                        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">{node.title}</h1>

                            {article?.content ? (
                                <div
                                    className="prose prose-sm sm:prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
                                    dangerouslySetInnerHTML={{ __html: article.content }}
                                />
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">No content yet.</p>
                            )}
                        </article>
                    </div>

                    {/* Sidebar - SEO Score first, then Article Info */}
                    <div className="w-full lg:w-80 shrink-0 order-1 lg:order-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:sticky lg:top-8">
                            {/* SEO Score Analysis - First */}
                            {seoScore && (
                                <div className="mb-6">
                                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">SEO Score</h2>

                                    {/* Score Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className="text-2xl font-bold"
                                            style={{ color: seoScore.zoneColor }}
                                        >
                                            {seoScore.totalScore}/100
                                        </span>
                                        <span
                                            className="text-xs font-medium px-2 py-1 rounded-full"
                                            style={{
                                                color: seoScore.zoneColor,
                                                backgroundColor: `${seoScore.zoneColor}15`
                                            }}
                                        >
                                            {seoScore.zoneLabel}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${seoScore.totalScore}%`,
                                                backgroundColor: seoScore.zoneColor
                                            }}
                                        />
                                    </div>

                                    {/* Gauge - hidden on mobile for cleaner look */}
                                    <div className="hidden sm:block">
                                        <SEOScoreGauge score={seoScore.totalScore} color={seoScore.zoneColor} />
                                    </div>

                                    {/* Categories */}
                                    <div className="mt-4 space-y-2">
                                        <SEOCategorySection category={seoScore.categories.targetKeyword} />
                                        <SEOCategorySection category={seoScore.categories.metaElements} />
                                        <SEOCategorySection category={seoScore.categories.contentStructure} />
                                        <SEOCategorySection category={seoScore.categories.readability} />
                                        <SEOCategorySection category={seoScore.categories.internalLinks} />
                                        <SEOCategorySection category={seoScore.categories.images} />
                                        <SEOCategorySection category={seoScore.categories.outboundLinks} />
                                    </div>
                                </div>
                            )}

                            {/* Fallback SEO Info (if no score but has seo_title/description) */}
                            {!seoScore && (article?.seo_title || article?.seo_description) && (
                                <div className="mb-6">
                                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">SEO Details</h2>

                                    <div className="space-y-4">
                                        {article.seo_title && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Title</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{article.seo_title}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{article.seo_title.length}/60 characters</p>
                                            </div>
                                        )}

                                        {article.seo_description && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{article.seo_description}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{article.seo_description.length}/160 characters</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Divider if SEO score exists */}
                            {(seoScore || article?.seo_title || article?.seo_description) && (
                                <hr className="mb-6 border-gray-200 dark:border-gray-700" />
                            )}

                            {/* Article Info - Second */}
                            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Article Info</h2>

                            <div className="space-y-4">
                                {/* Word Count */}
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Word Count</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{article?.word_count || 0} words</p>
                                    </div>
                                </div>

                                {/* Target Keyword */}
                                {node.target_keyword && (
                                    <div className="flex items-start gap-3">
                                        <Target className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Keyword</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{node.target_keyword}</p>
                                        </div>
                                    </div>
                                )}

                                {/* URL / Slug */}
                                {node.slug && (
                                    <div className="flex items-start gap-3">
                                        <Link2 className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL Slug</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                                {project?.domain ? `${project.domain}/${node.slug}` : node.slug}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Content Type */}
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Type</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{node.node_type}</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{node.status.replace('_', ' ')}</p>
                                    </div>
                                </div>

                                {/* Assigned To */}
                                {node.assigned_to && (
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{node.assigned_to}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-12">
                <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Shared via SyncSEO
                </div>
            </div>
        </div>
    );
}
