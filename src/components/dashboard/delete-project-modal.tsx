'use client';

import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { Project } from '@/lib/types';

interface DeleteProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    project: Project | null;
    isLoading?: boolean;
}

export function DeleteProjectModal({
    isOpen,
    onClose,
    onConfirm,
    project,
    isLoading
}: DeleteProjectModalProps) {
    if (!project) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Project" size="sm">
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-red-100">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <p className="text-gray-900">
                        Are you sure you want to delete <strong>{project.name}</strong>?
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        This action cannot be undone. All nodes and connections in this project will be permanently deleted.
                    </p>
                </div>
            </div>

            <ModalFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
                    Delete Project
                </Button>
            </ModalFooter>
        </Modal>
    );
}
