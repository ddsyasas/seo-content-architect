import { Suspense } from 'react';
import { CanvasEditor } from '@/components/canvas/canvas-editor';

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params;

    return (
        <div className="h-[calc(100vh-80px)] -m-6 bg-gray-50">
            <CanvasEditor projectId={id} />
        </div>
    );
}
