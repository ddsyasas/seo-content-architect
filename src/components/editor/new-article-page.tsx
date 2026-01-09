'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/helpers';
import { NODE_TYPE_LABELS } from '@/lib/utils/constants';
import type { NodeType } from '@/lib/types';

interface NewArticlePageProps {
    projectId: string;
}

export function NewArticlePage({ projectId }: NewArticlePageProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [nodeType, setNodeType] = useState<NodeType>('planned');
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!title.trim()) {
            setError('Please enter a title');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            // Check article limit before creating
            const limitCheck = await fetch('/api/limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'article', projectId })
            }).then(r => r.json());

            if (!limitCheck.allowed) {
                setError(limitCheck.message || `You've reached your article limit (${limitCheck.limit}). Upgrade your plan to add more articles.`);
                setIsCreating(false);
                return;
            }

            const supabase = createClient();
            const nodeId = uuidv4();

            // Create the node
            const { error: nodeError } = await supabase
                .from('nodes')
                .insert({
                    id: nodeId,
                    project_id: projectId,
                    node_type: nodeType,
                    title: title.trim(),
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    status: 'writing',
                    position_x: 400,
                    position_y: 300,
                });

            if (nodeError) throw nodeError;

            // Create the article
            const { error: articleError } = await supabase
                .from('articles')
                .insert({
                    node_id: nodeId,
                    project_id: projectId,
                    content: '',
                    word_count: 0,
                });

            if (articleError) throw articleError;

            // Navigate to editor
            router.push(`/project/${projectId}/article/${nodeId}`);
        } catch (err) {
            console.error('Failed to create article:', err);
            setError('Failed to create article');
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.push(`/project/${projectId}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">New Article</h1>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <Input
                        label="Article Title"
                        placeholder="Enter article title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['pillar', 'cluster', 'supporting', 'planned'] as NodeType[]).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setNodeType(type)}
                                    className={cn(
                                        'px-3 py-3 text-sm rounded-lg border transition-colors',
                                        nodeType === type
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    {NODE_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/project/${projectId}`)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            isLoading={isCreating}
                            className="flex-1"
                        >
                            Create Article
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
