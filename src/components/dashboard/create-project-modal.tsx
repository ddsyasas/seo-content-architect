'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROJECT_COLORS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';
import type { Project, CreateProjectInput } from '@/lib/types';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProjectInput) => Promise<void>;
    editProject?: Project | null;
}

export function CreateProjectModal({ isOpen, onClose, onSubmit, editProject }: CreateProjectModalProps) {
    const [name, setName] = useState(editProject?.name || '');
    const [description, setDescription] = useState(editProject?.description || '');
    const [websiteUrl, setWebsiteUrl] = useState(editProject?.website_url || '');
    const [domain, setDomain] = useState(editProject?.domain || '');
    const [color, setColor] = useState(editProject?.color || PROJECT_COLORS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setName(editProject?.name || '');
        setDescription(editProject?.description || '');
        setWebsiteUrl(editProject?.website_url || '');
        setDomain(editProject?.domain || '');
        setColor(editProject?.color || PROJECT_COLORS[0]);
    }, [editProject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Project name is required');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                website_url: websiteUrl.trim() || undefined,
                domain: domain.trim() || undefined,
                color,
            });
            handleClose();
        } catch (err) {
            setError('Failed to save project');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setWebsiteUrl('');
        setDomain('');
        setColor(PROJECT_COLORS[0]);
        setError('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={editProject ? 'Edit Project' : 'Create New Project'}
            size="md"
        >
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <Input
                        label="Project name"
                        placeholder="My SEO Content Strategy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoFocus
                    />

                    <Input
                        label="Description (optional)"
                        placeholder="Brief description of this content project"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <Input
                        label="Website URL (optional)"
                        placeholder="https://example.com"
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                    />

                    <div>
                        <Input
                            label="Domain (for visual URL preview)"
                            placeholder="example.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            For display only. Preview URLs like: {domain || 'example.com'}/your-article-slug
                        </p>
                    </div>

                    {/* Color picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project color
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        'w-8 h-8 rounded-lg transition-all',
                                        color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <ModalFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {editProject ? 'Save Changes' : 'Create Project'}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
