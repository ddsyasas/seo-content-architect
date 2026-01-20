'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Clock, FileText, Globe, Settings, LayoutGrid, Share2, Copy, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { SEOScorePanel } from '@/components/editor/seo-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, normalizeSlug } from '@/lib/utils/helpers';
import { extractInternalLinks, extractExternalLinks } from '@/lib/utils/link-parser';
import { NODE_TYPE_LABELS, STATUS_LABELS } from '@/lib/utils/constants';
import { useSEOScore } from '@/hooks/useSEOScore';
import { extractImages, extractInternalLinksForSEO, extractOutboundLinksForSEO } from '@/lib/seo/seo-analyzer';
import type { ContentNode, Project, Article, NodeType, NodeStatus } from '@/lib/types';
import type { UserRole } from '@/lib/utils/roles';
import { canEditContent } from '@/lib/utils/roles';

// Normalize URL for comparison (remove protocol, www, trailing slash)
function normalizeUrlForComparison(url: string): string {
    if (!url) return '';
    return url
        .toLowerCase()
        .replace(/^https?:\/\//, '')  // Remove protocol
        .replace(/^www\./, '')        // Remove www
        .replace(/\/$/, '');          // Remove trailing slash
}

interface ArticleEditorProps {
    projectId: string;
    nodeId: string;
    initialProject?: Project;
    initialNode?: ContentNode;
    initialArticle?: Article | null;
    initialUserRole?: UserRole;
    initialAvailableNodes?: { id: string; title: string; slug: string }[];
    initialCanPublicShare?: boolean;
}

export function ArticleEditor({
    projectId,
    nodeId,
    initialProject,
    initialNode,
    initialArticle,
    initialUserRole = 'viewer',
    initialAvailableNodes = [],
    initialCanPublicShare,
}: ArticleEditorProps) {
    const router = useRouter();
    // Loading is false if initial data is provided (Server Component pattern)
    const [isLoading, setIsLoading] = useState(!initialProject);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Data - use initial values if provided
    const [project, setProject] = useState<Project | null>(initialProject || null);
    const [node, setNode] = useState<ContentNode | null>(initialNode || null);
    const [article, setArticle] = useState<Article | null>(initialArticle || null);
    const [userRole, setUserRole] = useState<UserRole>(initialUserRole);
    const canEdit = canEditContent(userRole);

    // Form state - initialize from props if available
    const [content, setContent] = useState(initialArticle?.content || '');
    const [wordCount, setWordCount] = useState(initialArticle?.word_count || 0);
    const [title, setTitle] = useState(initialNode?.title || '');
    const [slug, setSlug] = useState(initialNode?.slug || '');
    const [targetKeyword, setTargetKeyword] = useState(initialNode?.target_keyword || '');
    const [nodeType, setNodeType] = useState<NodeType>(initialNode?.node_type || 'planned');
    const [status, setStatus] = useState<NodeStatus>(initialNode?.status || 'planned');
    const [seoTitle, setSeoTitle] = useState(initialArticle?.seo_title || '');

    const [seoDescription, setSeoDescription] = useState(initialArticle?.seo_description || '');
    const [availableNodes, setAvailableNodes] = useState<{ id: string; title: string; slug: string }[]>(initialAvailableNodes);
    const [nodeLimitWarning, setNodeLimitWarning] = useState<string | null>(null);

    // Share state - initialize from props if available
    const [isPublic, setIsPublic] = useState(initialNode?.is_public || false);
    const [shareId, setShareId] = useState<string | null>(initialNode?.share_id || null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [canPublicShare, setCanPublicShare] = useState<boolean | null>(initialCanPublicShare ?? null);

    // SEO Score calculation
    const articleContent = useMemo(() => ({
        title,
        content,
        seoTitle,
        seoDescription,
        targetKeyword,
        slug,
        images: extractImages(content),
        internalLinks: extractInternalLinksForSEO(content, project?.domain || undefined),
        outboundLinks: extractOutboundLinksForSEO(content, project?.domain || undefined),
    }), [title, content, seoTitle, seoDescription, targetKeyword, slug, project?.domain]);

    const seoScore = useSEOScore(articleContent);

    // Only fetch data client-side if initial data wasn't provided (Server Component pattern)
    useEffect(() => {
        // Skip loading if initial data was provided from Server Component
        if (initialProject) {
            return;
        }
        loadData();
    }, [projectId, nodeId, initialProject]);

    const loadData = async () => {
        const supabase = createClient();

        // Load project
        const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        setProject(projectData);

        // Get user role for permission checking
        try {
            const roleResponse = await fetch(`/api/projects/${projectId}/role`);
            if (roleResponse.ok) {
                const { role } = await roleResponse.json();
                setUserRole(role as UserRole);
            }
        } catch (error) {
            console.error('Failed to fetch user role:', error);
        }

        // Check if public sharing feature is available for this project
        try {
            const sharingCheck = await fetch('/api/limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'publicSharing', projectId })
            }).then(r => r.json());
            setCanPublicShare(sharingCheck.allowed);
        } catch (err) {
            console.error('Failed to check public sharing feature:', err);
            setCanPublicShare(false);
        }

        // Load node
        const { data: nodeData } = await supabase
            .from('nodes')
            .select('*')
            .eq('id', nodeId)
            .single();

        if (nodeData) {
            setNode(nodeData);
            setTitle(nodeData.title);
            setSlug(nodeData.slug || '');
            setTargetKeyword(nodeData.target_keyword || '');
            setNodeType(nodeData.node_type);
            setStatus(nodeData.status);
            setIsPublic(nodeData.is_public || false);
            setShareId(nodeData.share_id || null);
        }

        // Load article if exists
        const { data: articleData } = await supabase
            .from('articles')
            .select('*')
            .eq('node_id', nodeId)
            .single();

        if (articleData) {
            setArticle(articleData);
            setContent(articleData.content || '');
            setWordCount(articleData.word_count || 0);
            setSeoTitle(articleData.seo_title || '');
            setSeoDescription(articleData.seo_description || '');
        }

        // Load all available nodes for interlinking
        const { data: allNodes } = await supabase
            .from('nodes')
            .select('id, title, slug')
            .eq('project_id', projectId)
            .neq('id', nodeId)
            .neq('node_type', 'external');

        if (allNodes) {
            setAvailableNodes(allNodes as any);
        }

        setIsLoading(false);
    };

    // Auto-save with debounce
    const saveData = useCallback(async () => {
        if (!node) return;

        setIsSaving(true);
        const supabase = createClient();

        try {
            // Normalize slug before saving
            const normalizedSlug = normalizeSlug(slug);
            if (normalizedSlug !== slug) {
                setSlug(normalizedSlug);
            }

            // Update node
            await supabase
                .from('nodes')
                .update({
                    title,
                    slug: normalizedSlug,
                    target_keyword: targetKeyword,
                    node_type: nodeType,
                    status,
                })
                .eq('id', nodeId);

            // Upsert article
            const { error: articleError } = await supabase
                .from('articles')
                .upsert({
                    id: article?.id,
                    node_id: nodeId,
                    project_id: projectId,
                    content,
                    word_count: wordCount,
                    seo_title: seoTitle,
                    seo_description: seoDescription,
                }, { onConflict: 'node_id' });

            if (articleError) {
                console.error('[Save] Failed to save article:', articleError);
                console.error('[Save] Content size:', content?.length || 0, 'bytes');
            } else {
                console.log('[Save] Article saved successfully. Content size:', content?.length || 0, 'bytes');
            }

            // Auto-sync edges with internal links (bidirectional) and outbound links
            if (project?.domain && content) {
                console.log('[Link-Sync] Starting sync. Domain:', project.domain);

                // 1. Process Links
                const internalLinks = extractInternalLinks(content, project.domain);
                const externalLinks = extractExternalLinks(content, project.domain);
                console.log('[Link-Sync] Links found:', { internal: internalLinks.length, external: externalLinks.length });
                console.log('[Link-Sync] External links detail:', externalLinks.map(l => ({ href: l.href, anchor: l.anchorText })));

                // Get all nodes in this project to find targets
                const { data: allNodes } = await supabase
                    .from('nodes')
                    .select('id, slug, node_type, title, position_x, position_y, url')
                    .eq('project_id', projectId);

                const internalNodes = allNodes?.filter(n => n.node_type !== 'external') || [];
                const externalNodes = allNodes?.filter(n => n.node_type === 'external') || [];

                // Get existing edges from this node
                const { data: existingEdges } = await supabase
                    .from('edges')
                    .select('id, target_node_id, label, edge_type')
                    .eq('source_node_id', nodeId);

                console.log('[Link-Sync] Existing auto-edges:', existingEdges?.length || 0);

                // Create a map of current link slugs
                const currentLinkSlugs = new Set(internalLinks.map(l => l.slug));

                // DELETE internal edges that no longer have corresponding links
                // (skip outbound and backlink edges - they're handled separately)
                for (const edge of existingEdges || []) {
                    // Skip outbound and backlink edges - only clean up internal link edges
                    if (edge.edge_type === 'outbound' || edge.edge_type === 'backlink') {
                        continue;
                    }

                    const targetNode = allNodes?.find(n => n.id === edge.target_node_id);
                    if (targetNode && !currentLinkSlugs.has(targetNode.slug)) {
                        await supabase.from('edges').delete().eq('id', edge.id);
                        console.log(`[Link-Sync] DELETED internal edge to ${targetNode.slug}`);
                    }
                }

                // CREATE edges for new links
                const existingTargetIds = new Set(existingEdges?.map(e => e.target_node_id) || []);

                for (const link of internalLinks) {
                    const targetNode = allNodes?.find(n => n.slug === link.slug);
                    console.log(`[Link-Sync] Checking link ${link.slug}:`, targetNode ? 'Found node' : 'Node not found');

                    if (targetNode && targetNode.id !== nodeId && !existingTargetIds.has(targetNode.id)) {
                        // Calculate default handles based on relative position
                        let sourceHandle = 'right';
                        let targetHandle = 'left';

                        const sourceX = allNodes?.find(n => n.id === nodeId)?.position_x;
                        const sourceY = allNodes?.find(n => n.id === nodeId)?.position_y;

                        // Check positions if available
                        if (sourceX !== undefined && sourceY !== undefined &&
                            targetNode.position_x !== undefined && targetNode.position_y !== undefined) {

                            const dx = targetNode.position_x - sourceX;
                            const dy = targetNode.position_y - sourceY;

                            // Determine primary direction
                            if (Math.abs(dx) > Math.abs(dy)) {
                                // Horizontal dominant
                                if (dx > 0) {
                                    // Target is to the right
                                    sourceHandle = 'right';
                                    targetHandle = 'left';
                                } else {
                                    // Target is to the left
                                    sourceHandle = 'left';
                                    targetHandle = 'right';
                                }
                            } else {
                                // Vertical dominant
                                if (dy > 0) {
                                    // Target is below
                                    sourceHandle = 'bottom';
                                    targetHandle = 'top';
                                } else {
                                    // Target is above
                                    sourceHandle = 'top';
                                    targetHandle = 'bottom';
                                }
                            }
                        }

                        await supabase.from('edges').insert({
                            id: uuidv4(),
                            project_id: projectId,
                            source_node_id: nodeId,
                            target_node_id: targetNode.id,
                            source_handle_id: sourceHandle,
                            target_handle_id: targetHandle,
                            edge_type: 'interlinks',
                            label: link.anchorText,
                        });
                        console.log(`[Link-Sync] CREATED edge: ${title} → ${link.slug} (${link.anchorText}) [${sourceHandle}->${targetHandle}]`);
                    }
                }
                // --- Handle Outbound (External) Links ---
                // Check node limit before creating external nodes
                let nodeLimit = { allowed: true, current: 0, limit: 999999 };
                try {
                    const limitRes = await fetch('/api/limits', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'node', projectId })
                    });
                    nodeLimit = await limitRes.json();
                } catch (e) {
                    console.log('[Link-Sync] Could not check node limit, proceeding');
                }
                let nodesCreatedInThisSave = 0;

                // Create one external node per unique URL (not grouped by domain)
                const outboundLinks = new Map<string, { anchor: string; domain: string }>();
                for (const link of externalLinks) {
                    try {
                        const urlObj = new URL(link.href.startsWith('http') ? link.href : `https://${link.href}`);
                        const domain = urlObj.hostname.replace(/^www\./, '');
                        const normalizedUrl = link.href.trim();

                        if (domain && normalizedUrl && !outboundLinks.has(normalizedUrl)) {
                            outboundLinks.set(normalizedUrl, {
                                anchor: link.anchorText.trim() || domain,
                                domain
                            });
                        }
                    } catch (e) { /* ignore */ }
                }
                console.log('[Link-Sync] Unique outbound URLs:', Array.from(outboundLinks.keys()));

                const existingOutboundEdgeTargetIds = new Set(
                    existingEdges?.filter(e => e.edge_type === 'outbound').map(e => e.target_node_id)
                );

                // Process each unique outbound link
                for (const [url, linkData] of outboundLinks) {
                    // Find existing external node by URL (normalized comparison)
                    const normalizedUrl = normalizeUrlForComparison(url);
                    let externalNode = externalNodes.find(n =>
                        normalizeUrlForComparison(n.url || '') === normalizedUrl
                    );

                    if (!externalNode) {
                        // Check if we can create more nodes
                        if (!nodeLimit.allowed || (nodeLimit.current + nodesCreatedInThisSave) >= nodeLimit.limit) {
                            console.log(`[Link-Sync] Node limit reached (${nodeLimit.current + nodesCreatedInThisSave}/${nodeLimit.limit}), skipping external node for: ${url}`);
                            setNodeLimitWarning(`Node limit reached (${nodeLimit.limit}). Some external link nodes weren't created. Upgrade your plan to add more.`);
                            continue;
                        }

                        // Create new external node for this URL
                        const currentX = allNodes?.find(n => n.id === nodeId)?.position_x || 0;
                        const currentY = allNodes?.find(n => n.id === nodeId)?.position_y || 0;

                        const { data: newNode } = await supabase
                            .from('nodes')
                            .insert({
                                id: uuidv4(),
                                project_id: projectId,
                                node_type: 'external',
                                title: linkData.anchor, // Use anchor text as title
                                slug: `ext-${uuidv4().substring(0, 8)}`,
                                url: url, // Store the full URL
                                status: 'published',
                                position_x: currentX + 300 + (Math.random() * 100),
                                position_y: currentY + (Math.random() * 200 - 100),
                            })
                            .select()
                            .single();

                        if (newNode) {
                            externalNode = newNode;
                            nodesCreatedInThisSave++;
                            console.log(`[Link-Sync] Created new External Node: "${linkData.anchor}" (URL: ${url})`);
                            externalNodes.push(newNode);
                        }
                    }

                    if (externalNode && !existingOutboundEdgeTargetIds.has(externalNode.id)) {
                        // Calculate default handles based on relative position
                        let sourceHandle = 'right';
                        let targetHandle = 'left';

                        const sourceX = allNodes?.find(n => n.id === nodeId)?.position_x;
                        const sourceY = allNodes?.find(n => n.id === nodeId)?.position_y;

                        // Check positions if available
                        if (sourceX !== undefined && sourceY !== undefined &&
                            externalNode.position_x !== undefined && externalNode.position_y !== undefined) {

                            const dx = externalNode.position_x - sourceX;
                            const dy = externalNode.position_y - sourceY;

                            // Determine primary direction
                            if (Math.abs(dx) > Math.abs(dy)) {
                                if (dx > 0) {
                                    sourceHandle = 'right';
                                    targetHandle = 'left';
                                } else {
                                    sourceHandle = 'left';
                                    targetHandle = 'right';
                                }
                            } else {
                                if (dy > 0) {
                                    sourceHandle = 'bottom';
                                    targetHandle = 'top';
                                } else {
                                    sourceHandle = 'top';
                                    targetHandle = 'bottom';
                                }
                            }
                        }

                        await supabase.from('edges').insert({
                            id: uuidv4(),
                            project_id: projectId,
                            source_node_id: nodeId,
                            target_node_id: externalNode.id,
                            source_handle_id: sourceHandle,
                            target_handle_id: targetHandle,
                            edge_type: 'outbound',
                            label: linkData.anchor.substring(0, 30) + (linkData.anchor.length > 30 ? '...' : ''),
                        });
                        console.log(`[Link-Sync] CREATED outbound edge to "${linkData.anchor}" [${sourceHandle}->${targetHandle}]`);
                    }
                }

                // Cleanup outbound edges - only if we detected some links
                // (prevents deleting all edges when content isn't properly loaded)
                if (externalLinks.length > 0 || outboundLinks.size > 0) {
                    for (const edge of existingEdges || []) {
                        if (edge.edge_type === 'outbound') {
                            const targetExtNode = externalNodes.find(n => n.id === edge.target_node_id);
                            if (targetExtNode && targetExtNode.url && !outboundLinks.has(targetExtNode.url)) {
                                await supabase.from('edges').delete().eq('id', edge.id);
                                console.log(`[Link-Sync] DELETED outbound edge to ${targetExtNode.url}`);
                            }
                        }
                    }
                } else {
                    console.log('[Link-Sync] Skipping outbound edge cleanup - no external links detected');
                }

            } else if (!project?.domain) {
                console.warn('[Link-Sync] Skipped - no domain set for project');
            }

            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    }, [node, nodeId, projectId, project, article, title, slug, targetKeyword, nodeType, status, content, wordCount, seoTitle, seoDescription]);

    // Keyboard shortcut for save (Cmd+S on Mac, Ctrl+S on Windows/Linux)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault(); // Prevent browser's save dialog
                saveData();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveData]);

    // Auto-save every 5 seconds if there are changes
    useEffect(() => {
        if (!node) return;
        const timer = setTimeout(saveData, 5000);
        return () => clearTimeout(timer);
    }, [content, title, slug, targetKeyword, nodeType, status, seoTitle, seoDescription]);

    const generateSlug = () => {
        setSlug(normalizeSlug(title));
    };

    // Toggle public sharing
    const togglePublicShare = async () => {
        // Server-side check to prevent API manipulation
        if (!isPublic) {
            // Only check when ENABLING sharing (not when disabling)
            try {
                const sharingCheck = await fetch('/api/limits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'publicSharing', projectId })
                }).then(r => r.json());

                if (!sharingCheck.allowed) {
                    // Feature not available - don't enable
                    setCanPublicShare(false);
                    return;
                }
            } catch (err) {
                console.error('Failed to verify public sharing feature:', err);
                return;
            }
        }

        const newIsPublic = !isPublic;

        try {
            // Use API to toggle share status (uses Prisma, bypasses RLS)
            const response = await fetch(`/api/nodes/${nodeId}/share`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: newIsPublic }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsPublic(data.isPublic);
                if (data.shareId) setShareId(data.shareId);
            } else {
                console.error('Failed to toggle share status');
            }
        } catch (err) {
            console.error('Failed to toggle share status:', err);
        }
    };

    // Copy share link to clipboard
    const copyShareLink = () => {
        if (!shareId) return;
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white dark:bg-gray-900">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => router.push(`/project/${projectId}`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 shrink-0"
                        title="Back to Articles"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => router.push(`/project/${projectId}?tab=canvas`)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors shrink-0"
                        title="View Canvas"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Canvas</span>
                    </button>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Article Title"
                        disabled={!canEdit}
                        className="flex-1 text-lg sm:text-2xl font-bold bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-w-0 disabled:cursor-not-allowed"
                    />

                    <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {wordCount} words
                        </span>
                        {lastSaved && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 shrink-0"
                        title="Toggle Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {canEdit && (
                        <Button onClick={saveData} isLoading={isSaving} className="gap-2 shrink-0">
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Save</span>
                        </Button>
                    )}
                </div>

                {/* Node limit warning */}
                {nodeLimitWarning && (
                    <div className="mx-3 sm:mx-6 mt-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between gap-2">
                        <span className="text-amber-800 dark:text-amber-300 text-sm">{nodeLimitWarning}</span>
                        <button
                            onClick={() => setNodeLimitWarning(null)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold shrink-0"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Editor - Toolbar sticks at top, content scrolls */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="w-full flex-1 flex flex-col min-h-0 px-2 pt-2">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            onWordCountChange={setWordCount}
                            placeholder="Start writing your article..."
                            availableNodes={availableNodes}
                            projectDomain={project?.domain || undefined}
                            readOnly={!canEdit}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                'fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto z-50 transform transition-transform duration-200 lg:relative lg:translate-x-0',
                isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                <div className="p-4 space-y-6">
                    {/* Share Section - At the very top */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Share Article</h3>
                        </div>

                        {/* Show upgrade prompt if feature not available */}
                        {canPublicShare === false && (
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    Share articles with clients via a public link.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/pricing')}
                                    className="w-full text-xs"
                                >
                                    Upgrade to Pro to unlock
                                </Button>
                            </div>
                        )}

                        {/* Show toggle if feature is available */}
                        {canPublicShare === true && (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Public sharing</span>
                                    <button
                                        onClick={togglePublicShare}
                                        className={cn(
                                            'relative w-11 h-6 rounded-full transition-colors',
                                            isPublic ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                                                isPublic && 'translate-x-5'
                                            )}
                                        />
                                    </button>
                                </div>

                                {isPublic && shareId && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Anyone with this link can view the article
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareId}`}
                                                className="flex-1 text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300"
                                            />
                                            <button
                                                onClick={copyShareLink}
                                                className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded transition-colors"
                                                title="Copy link"
                                            >
                                                {copySuccess ? (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!isPublic && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Enable to generate a shareable link
                                    </p>
                                )}
                            </>
                        )}

                        {/* Show loading state */}
                        {canPublicShare === null && (
                            <div className="h-6 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* SEO Score Panel */}
                    <SEOScorePanel score={seoScore} />

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* SEO Settings */}
                    <h3 className="font-semibold text-gray-900 dark:text-white">SEO Settings</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Target Keyword
                        </label>
                        <Input
                            value={targetKeyword}
                            onChange={(e) => setTargetKeyword(e.target.value)}
                            placeholder="main keyword to target"
                            disabled={!canEdit}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SEO Title
                        </label>
                        <Input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            placeholder="Page title for search engines"
                            disabled={!canEdit}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {seoTitle.length}/60 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SEO Description
                        </label>
                        <textarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            placeholder="Meta description for search engines"
                            rows={3}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {seoDescription.length}/160 characters
                        </p>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <h3 className="font-semibold text-gray-900 dark:text-white">Article Settings</h3>

                    {/* Domain Warning / URL Preview */}
                    {!project?.domain ? (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
                                ⚠️ Project domain not set
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                Set the domain in Project Settings (3-dot menu on project card) to enable URL previews and auto-linking.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                URL Preview
                            </label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                                <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    {project.domain}/{slug || 'slug'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Slug
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="article-slug"
                                disabled={!canEdit}
                            />
                            {canEdit && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={generateSlug}
                                    className="text-xs px-2"
                                >
                                    Auto
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Node Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Content Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['pillar', 'cluster', 'supporting', 'planned'] as NodeType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNodeType(type)}
                                    className={cn(
                                        'px-3 py-2 text-sm rounded-lg border transition-colors',
                                        nodeType === type
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                                    )}
                                >
                                    {NODE_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['planned', 'writing', 'published', 'needs_update'] as NodeStatus[]).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        'px-3 py-2 text-sm rounded-lg border transition-colors',
                                        status === s
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                                    )}
                                >
                                    {STATUS_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
