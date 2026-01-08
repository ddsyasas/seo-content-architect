'use client';

import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/helpers';
import { STATUS_LABELS, NODE_TYPE_LABELS } from '@/lib/utils/constants';
import type { NodeStatus, NodeType } from '@/lib/types';
import type { Node } from 'reactflow';

interface NodeDetailPanelProps {
    node: Node | undefined;
    onClose: () => void;
    onChange: (data: Partial<Node['data']>) => void;
    onDelete: () => void;
    projectDomain?: string;
    projectId: string;
}

export function NodeDetailPanel({ node, onClose, onChange, onDelete, projectDomain: propDomain, projectId }: NodeDetailPanelProps) {
    if (!node) return null;

    const data = node.data as {
        title: string;
        target_keyword: string | null;
        status: NodeStatus;
        slug: string | null;
        url: string | null;
        notes: string | null;
        word_count_target: number | null;
        assigned_to: string | null;
        publish_date: string | null;
        incomingLinks?: number;
        outgoingLinks?: number;
    };

    const [domain, setDomain] = useState(propDomain || '');

    useEffect(() => {
        if (propDomain) {
            setDomain(propDomain);
        } else if (projectId) {
            const fetchDomain = async () => {
                const supabase = createClient();
                const { data } = await supabase.from('projects').select('domain').eq('id', projectId).single();
                if (data?.domain) setDomain(data.domain);
            };
            fetchDomain();
        }
    }, [propDomain, projectId]);

    const statuses: NodeStatus[] = ['planned', 'writing', 'published', 'needs_update'];

    return (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Node Details</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {NODE_TYPE_LABELS[node.type as NodeType]}
                    </div>
                </div>

                <Input
                    label="Title"
                    value={data.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                        value={data.status}
                        onChange={(e) => onChange({ status: e.target.value as NodeStatus })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Target Keyword"
                    value={data.target_keyword || ''}
                    onChange={(e) => onChange({ target_keyword: e.target.value || null })}
                    placeholder="e.g., content marketing"
                />

                <Input
                    label="Slug"
                    value={data.slug || ''}
                    onChange={(e) => onChange({ slug: e.target.value || null })}
                    placeholder="e.g., content-marketing-guide"
                />

                <Input
                    label="URL"
                    value={
                        // For external nodes, show the stored URL or just the title (domain)
                        node.type === 'external'
                            ? (data.url || data.title || '')
                            : (data.url || (domain && data.slug ? `${domain}/${data.slug}` : ''))
                    }
                    onChange={(e) => onChange({ url: e.target.value || null })}
                    placeholder={node.type === 'external' ? 'https://external-site.com/...' : 'https://example.com/...'}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea
                        value={data.notes || ''}
                        onChange={(e) => onChange({ notes: e.target.value || null })}
                        placeholder="Add notes about this content..."
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    />
                </div>

                <Input
                    label="Word Count Target"
                    type="number"
                    value={data.word_count_target || ''}
                    onChange={(e) => onChange({ word_count_target: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 2000"
                />

                <Input
                    label="Assigned To"
                    value={data.assigned_to || ''}
                    onChange={(e) => onChange({ assigned_to: e.target.value || null })}
                    placeholder="Team member name"
                />

                <Input
                    label="Publish Date"
                    type="date"
                    value={data.publish_date || ''}
                    onChange={(e) => onChange({ publish_date: e.target.value || null })}
                />

                {/* Link counts */}
                <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Links</h4>
                    <div className="flex gap-4 text-sm">
                        <span className="text-gray-700">
                            <span className="font-medium">{data.incomingLinks || 0}</span> incoming
                        </span>
                        <span className="text-gray-700">
                            <span className="font-medium">{data.outgoingLinks || 0}</span> outgoing
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <Button variant="danger" onClick={onDelete} className="w-full">
                    <Trash2 className="w-4 h-4" />
                    Delete Node
                </Button>
            </div>
        </div>
    );
}
